import Redis from 'ioredis';
import { logger } from '../middleware/logging';
import { EventEmitter } from 'events';

/**
 * 큐 메시지 인터페이스
 * @interface QueueMessage
 */
interface QueueMessage {
  /** 메시지 ID */
  id: string;
  /** 메시지 타입 */
  type: string;
  /** 메시지 페이로드 */
  payload: any;
  /** 타임스탬프 */
  timestamp: number;
  /** 시도 횟수 */
  attempts: number;
  /** 사용자 ID */
  userId?: string;
  /** 매칭 ID */
  matchId?: string;
}

/**
 * 큐 옵션 인터페이스
 * @interface QueueOptions
 */
interface QueueOptions {
  /** 최대 재시도 횟수 */
  maxRetries?: number;
  /** 재시도 지연 시간 */
  retryDelay?: number;
  /** TTL (초) */
  ttl?: number;
}

/**
 * 메시지 큐 서비스 - Redis 기반 메시지 큐 관리
 * @class MessageQueueService
 * @extends {EventEmitter}
 */
export class MessageQueueService extends EventEmitter {
  /** Redis publisher 클라이언트 */
  private publisher: Redis;
  /** Redis subscriber 클라이언트 */
  private subscriber: Redis;
  /** 연결 상태 */
  private isConnected: boolean = false;

  /**
   * MessageQueueService 생성자
   */
  constructor() {
    super();
    
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    };

    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    this.setupEventHandlers();
    this.startQueueProcessor();
  }

  /**
   * 이벤트 핸들러 설정
   * @private
   * @returns {void}
   */
  private setupEventHandlers() {
    this.publisher.on('connect', () => {
      logger.info('Message queue publisher connected');
      this.isConnected = true;
    });

    this.subscriber.on('connect', () => {
      logger.info('Message queue subscriber connected');
    });

    this.publisher.on('error', (error) => {
      logger.error('Message queue publisher error:', error);
      this.isConnected = false;
    });

    this.subscriber.on('error', (error) => {
      logger.error('Message queue subscriber error:', error);
    });
  }

  /**
   * 오프라인 사용자를 위한 메시지 큐 추가
   * @param {string} userId - 사용자 ID
   * @param {any} message - 메시지
   * @param {QueueOptions} [options={}] - 큐 옵션
   * @returns {Promise<void>}
   * @throws {Error} 큐 추가 실패 시
   */
  async enqueueOfflineMessage(userId: string, message: any, options: QueueOptions = {}) {
    if (!this.isConnected) {
      logger.warn('Message queue not connected, message may be lost');
      return;
    }

    const queueMessage: QueueMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'offline_message',
      payload: message,
      timestamp: Date.now(),
      attempts: 0,
      userId
    };

    const queueKey = `offline_messages:${userId}`;
    const ttl = options.ttl || 7 * 24 * 60 * 60; // 7 days default

    try {
      await this.publisher.zadd(queueKey, Date.now(), JSON.stringify(queueMessage));
      await this.publisher.expire(queueKey, ttl);
      
      logger.info(`Enqueued offline message for user ${userId}`);
    } catch (error) {
      logger.error('Failed to enqueue offline message:', error);
      throw error;
    }
  }

  /**
   * 사용자의 오프라인 메시지 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<any[]>} 오프라인 메시지 목록
   */
  async getOfflineMessages(userId: string): Promise<any[]> {
    if (!this.isConnected) return [];

    const queueKey = `offline_messages:${userId}`;

    try {
      // Get all messages sorted by timestamp
      const messages = await this.publisher.zrange(queueKey, 0, -1);
      
      // Parse and return messages
      return messages.map(msg => {
        try {
          return JSON.parse(msg);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      logger.error('Failed to get offline messages:', error);
      return [];
    }
  }

  /**
   * 사용자의 오프라인 메시지 삭제
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async clearOfflineMessages(userId: string): Promise<void> {
    if (!this.isConnected) return;

    const queueKey = `offline_messages:${userId}`;

    try {
      await this.publisher.del(queueKey);
      logger.info(`Cleared offline messages for user ${userId}`);
    } catch (error) {
      logger.error('Failed to clear offline messages:', error);
    }
  }

  /**
   * 실패한 푸시 알림 재시도 큐 추가
   * @param {any} notification - 알림 데이터
   * @param {QueueOptions} [options={}] - 큐 옵션
   * @returns {Promise<void>}
   */
  async enqueuePushNotificationRetry(notification: any, options: QueueOptions = {}) {
    if (!this.isConnected) {
      logger.warn('Message queue not connected, push notification retry may be lost');
      return;
    }

    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 60000; // 1 minute default

    const queueMessage: QueueMessage = {
      id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'push_notification_retry',
      payload: notification,
      timestamp: Date.now(),
      attempts: (notification.attempts || 0) + 1,
      userId: notification.userId
    };

    if (queueMessage.attempts > maxRetries) {
      logger.warn(`Push notification retry limit exceeded for user ${notification.userId}`);
      await this.logFailedNotification(notification);
      return;
    }

    const queueKey = 'push_notification_retry_queue';
    const score = Date.now() + retryDelay * queueMessage.attempts;

    try {
      await this.publisher.zadd(queueKey, score, JSON.stringify(queueMessage));
      logger.info(`Enqueued push notification retry for user ${notification.userId}, attempt ${queueMessage.attempts}`);
    } catch (error) {
      logger.error('Failed to enqueue push notification retry:', error);
    }
  }

  /**
   * 큐 처리기 시작
   * @private
   * @returns {Promise<void>}
   */
  private async startQueueProcessor() {
    setInterval(async () => {
      if (!this.isConnected) return;

      try {
        await this.processPushNotificationRetries();
      } catch (error) {
        logger.error('Queue processor error:', error);
      }
    }, 30000); // Process every 30 seconds
  }

  /**
   * 푸시 알림 재시도 처리
   * @private
   * @returns {Promise<void>}
   */
  private async processPushNotificationRetries() {
    const queueKey = 'push_notification_retry_queue';
    const now = Date.now();

    try {
      // Get messages ready for retry
      const messages = await this.publisher.zrangebyscore(queueKey, 0, now, 'LIMIT', 0, 10);

      for (const messageStr of messages) {
        try {
          const message = JSON.parse(messageStr) as QueueMessage;
          
          // Emit event for retry
          this.emit('push_notification_retry', message.payload);

          // Remove from queue
          await this.publisher.zrem(queueKey, messageStr);
        } catch (error) {
          logger.error('Failed to process retry message:', error);
        }
      }
    } catch (error) {
      logger.error('Failed to process push notification retries:', error);
    }
  }

  /**
   * 실패한 알림 로깅 (분석용)
   * @private
   * @param {any} notification - 알림 데이터
   * @returns {Promise<void>}
   */
  private async logFailedNotification(notification: any) {
    const failedKey = `failed_notifications:${new Date().toISOString().split('T')[0]}`;
    
    try {
      await this.publisher.lpush(failedKey, JSON.stringify({
        notification,
        failedAt: new Date().toISOString()
      }));
      
      // Keep failed notifications for 30 days
      await this.publisher.expire(failedKey, 30 * 24 * 60 * 60);
    } catch (error) {
      logger.error('Failed to log failed notification:', error);
    }
  }

  /**
   * 실시간 이벤트 발행
   * @param {string} channel - 채널 이름
   * @param {any} event - 이벤트 데이터
   * @returns {Promise<void>}
   */
  async publishEvent(channel: string, event: any) {
    if (!this.isConnected) {
      logger.warn('Message queue not connected, event may be lost');
      return;
    }

    try {
      await this.publisher.publish(channel, JSON.stringify(event));
    } catch (error) {
      logger.error(`Failed to publish event to channel ${channel}:`, error);
    }
  }

  /**
   * 실시간 이벤트 구독
   * @param {string} channel - 채널 이름
   * @param {Function} callback - 메시지 처리 콜백
   * @returns {Promise<void>}
   */
  async subscribeToChannel(channel: string, callback: (message: any) => void) {
    try {
      await this.subscriber.subscribe(channel);
      
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            logger.error('Failed to parse message:', error);
          }
        }
      });
    } catch (error) {
      logger.error(`Failed to subscribe to channel ${channel}:`, error);
    }
  }

  /**
   * 서비스 종료
   * @returns {Promise<void>}
   */
  async disconnect() {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit()
    ]);
    this.isConnected = false;
  }
}

export const messageQueueService = new MessageQueueService();