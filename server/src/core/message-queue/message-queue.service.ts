import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createClient, RedisClientType } from 'redis';
import { Cron } from '@nestjs/schedule';

/**
 * 큐 메시지 인터페이스
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
 * 메시지 큐 서비스
 *
 * Redis 기반 메시지 큐를 관리하며 오프라인 메시지와 실패한 작업의 재시도를 처리합니다.
 */
@Injectable()
export class MessageQueueService implements OnModuleInit, OnModuleDestroy {
  /** Redis publisher 클라이언트 */
  private publisher: RedisClientType;
  /** Redis subscriber 클라이언트 */
  private subscriber: RedisClientType;
  /** 연결 상태 */
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Redis will be initialized in setupEventHandlers if configured
  }

  /**
   * 모듈 초기화
   */
  async onModuleInit() {
    const redisUrl = this.configService.get('REDIS_URL');
    console.log('Redis URL from config:', redisUrl ? 'Found' : 'Not found');

    if (redisUrl) {
      await this.setupEventHandlers();
    } else {
      console.log('Redis not configured, MessageQueue service disabled');
    }
  }

  /**
   * 모듈 종료
   */
  async onModuleDestroy() {
    if (this.isConnected) {
      await this.disconnect();
    }
  }

  /**
   * 이벤트 핸들러 설정
   */
  private async setupEventHandlers() {
    try {
      const redisUrl = this.configService.get('REDIS_URL');

      if (!redisUrl) {
        console.log('REDIS_URL not configured, skipping Redis connection');
        return;
      }

      // Use only REDIS_URL for all Redis configuration
      const redisConfig = {
        url: redisUrl,
      };

      this.publisher = createClient(redisConfig);
      this.subscriber = createClient(redisConfig);

      // Connect to Redis
      await this.publisher.connect();
      await this.subscriber.connect();

      this.publisher.on('connect', () => {
        console.log('Message queue publisher connected');
        this.isConnected = true;
      });

      this.subscriber.on('connect', () => {
        console.log('Message queue subscriber connected');
      });

      this.publisher.on('error', (error) => {
        console.error('Message queue publisher error:', error);
        this.isConnected = false;
      });

      this.subscriber.on('error', (error) => {
        console.error('Message queue subscriber error:', error);
      });

      console.log('Redis connected successfully');
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * 오프라인 사용자를 위한 메시지 큐 추가
   */
  async enqueueOfflineMessage(
    userId: string,
    message: any,
    options: QueueOptions = {},
  ): Promise<void> {
    if (!this.isConnected) {
      console.warn('Message queue not connected, message may be lost');
      return;
    }

    const queueMessage: QueueMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'offline_message',
      payload: message,
      timestamp: Date.now(),
      attempts: 0,
      userId,
    };

    const queueKey = `offline_messages:${userId}`;
    const ttl = options.ttl || 7 * 24 * 60 * 60; // 7 days default

    try {
      await this.publisher.zAdd(queueKey, {
        score: Date.now(),
        value: JSON.stringify(queueMessage),
      });
      await this.publisher.expire(queueKey, ttl);

      console.log(`Enqueued offline message for user ${userId}`);
    } catch (error) {
      console.error('Failed to enqueue offline message:', error);
      throw error;
    }
  }

  /**
   * 사용자의 오프라인 메시지 조회
   */
  async getOfflineMessages(userId: string): Promise<any[]> {
    if (!this.isConnected) return [];

    const queueKey = `offline_messages:${userId}`;

    try {
      // Get all messages sorted by timestamp
      const messages = await this.publisher.zRange(queueKey, 0, -1);

      // Parse and return messages
      return messages
        .map((msg) => {
          try {
            return JSON.parse(msg);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Failed to get offline messages:', error);
      return [];
    }
  }

  /**
   * 사용자의 오프라인 메시지 삭제
   */
  async clearOfflineMessages(userId: string): Promise<void> {
    if (!this.isConnected) return;

    const queueKey = `offline_messages:${userId}`;

    try {
      await this.publisher.del(queueKey);
      console.log(`Cleared offline messages for user ${userId}`);
    } catch (error) {
      console.error('Failed to clear offline messages:', error);
    }
  }

  /**
   * 실패한 푸시 알림 재시도 큐 추가
   */
  async enqueuePushNotificationRetry(
    notification: any,
    options: QueueOptions = {},
  ): Promise<void> {
    if (!this.isConnected) {
      console.warn(
        'Message queue not connected, push notification retry may be lost',
      );
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
      userId: notification.userId,
    };

    if (queueMessage.attempts > maxRetries) {
      console.warn(
        `Push notification retry limit exceeded for user ${notification.userId}`,
      );
      await this.logFailedNotification(notification);
      return;
    }

    const queueKey = 'push_notification_retry_queue';
    const score = Date.now() + retryDelay * queueMessage.attempts;

    try {
      await this.publisher.zAdd(queueKey, {
        score,
        value: JSON.stringify(queueMessage),
      });
      console.log(
        `Enqueued push notification retry for user ${notification.userId}, attempt ${queueMessage.attempts}`,
      );
    } catch (error) {
      console.error('Failed to enqueue push notification retry:', error);
    }
  }

  /**
   * 푸시 알림 재시도 처리 (30초마다 실행)
   */
  @Cron('*/30 * * * * *')
  async processPushNotificationRetries(): Promise<void> {
    if (!this.isConnected) return;

    const queueKey = 'push_notification_retry_queue';
    const now = Date.now();

    try {
      // Get messages ready for retry
      const messages = await this.publisher.zRangeByScore(queueKey, 0, now, {
        LIMIT: { offset: 0, count: 10 },
      });

      for (const messageStr of messages) {
        try {
          const message = JSON.parse(messageStr) as QueueMessage;

          // Emit event for retry
          this.eventEmitter.emit('push_notification_retry', message.payload);

          // Remove from queue
          await this.publisher.zRem(queueKey, messageStr);
        } catch (error) {
          console.error('Failed to process retry message:', error);
        }
      }
    } catch (error) {
      console.error('Failed to process push notification retries:', error);
    }
  }

  /**
   * 실패한 알림 로깅 (분석용)
   */
  private async logFailedNotification(notification: any): Promise<void> {
    const failedKey = `failed_notifications:${new Date().toISOString().split('T')[0]}`;

    try {
      await this.publisher.lPush(
        failedKey,
        JSON.stringify({
          notification,
          failedAt: new Date().toISOString(),
        }),
      );

      // Keep failed notifications for 30 days
      await this.publisher.expire(failedKey, 30 * 24 * 60 * 60);
    } catch (error) {
      console.error('Failed to log failed notification:', error);
    }
  }

  /**
   * 실시간 이벤트 발행
   */
  async publishEvent(channel: string, event: any): Promise<void> {
    if (!this.isConnected) {
      console.warn('Message queue not connected, event may be lost');
      return;
    }

    try {
      await this.publisher.publish(channel, JSON.stringify(event));
    } catch (error) {
      console.error(`Failed to publish event to channel ${channel}:`, error);
    }
  }

  /**
   * 실시간 이벤트 구독
   */
  async subscribeToChannel(
    channel: string,
    callback: (message: any) => void,
  ): Promise<void> {
    try {
      await this.subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });
    } catch (error) {
      console.error(`Failed to subscribe to channel ${channel}:`, error);
    }
  }

  /**
   * 서비스 종료
   */
  async disconnect(): Promise<void> {
    if (this.publisher && this.subscriber) {
      try {
        await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
      } catch (error) {
        console.error('Error disconnecting from Redis:', error);
      }
    }
    this.isConnected = false;
  }

  /**
   * 배치 작업 큐에 추가
   */
  async enqueueBatchJob(
    jobType: string,
    data: any,
    options: QueueOptions = {},
  ): Promise<void> {
    if (!this.isConnected) {
      console.warn('Message queue not connected, batch job may be lost');
      return;
    }

    const queueMessage: QueueMessage = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: jobType,
      payload: data,
      timestamp: Date.now(),
      attempts: 0,
    };

    const queueKey = `batch_jobs:${jobType}`;
    const ttl = options.ttl || 24 * 60 * 60; // 1 day default

    try {
      await this.publisher.lPush(queueKey, JSON.stringify(queueMessage));
      await this.publisher.expire(queueKey, ttl);

      console.log(`Enqueued batch job: ${jobType}`);
    } catch (error) {
      console.error('Failed to enqueue batch job:', error);
      throw error;
    }
  }

  /**
   * 배치 작업 처리
   */
  async processBatchJobs(
    jobType: string,
    batchSize: number = 10,
  ): Promise<any[]> {
    if (!this.isConnected) return [];

    const queueKey = `batch_jobs:${jobType}`;
    const jobs: any[] = [];

    try {
      for (let i = 0; i < batchSize; i++) {
        const jobStr = await this.publisher.rPop(queueKey);
        if (!jobStr) break;

        try {
          const job = JSON.parse(jobStr);
          jobs.push(job);
        } catch (error) {
          console.error('Failed to parse batch job:', error);
        }
      }
    } catch (error) {
      console.error('Failed to process batch jobs:', error);
    }

    return jobs;
  }

  /**
   * 지연된 작업 예약
   */
  async scheduleDelayedJob(
    jobType: string,
    data: any,
    delayMs: number,
  ): Promise<void> {
    if (!this.isConnected) {
      console.warn('Message queue not connected, delayed job may be lost');
      return;
    }

    const queueMessage: QueueMessage = {
      id: `delayed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: jobType,
      payload: data,
      timestamp: Date.now(),
      attempts: 0,
    };

    const queueKey = 'delayed_jobs';
    const score = Date.now() + delayMs;

    try {
      await this.publisher.zAdd(queueKey, {
        score,
        value: JSON.stringify(queueMessage),
      });
      console.log(`Scheduled delayed job: ${jobType} to run in ${delayMs}ms`);
    } catch (error) {
      console.error('Failed to schedule delayed job:', error);
      throw error;
    }
  }

  /**
   * 지연된 작업 처리 (1분마다 실행)
   */
  @Cron('0 * * * * *')
  async processDelayedJobs(): Promise<void> {
    if (!this.isConnected) return;

    const queueKey = 'delayed_jobs';
    const now = Date.now();

    try {
      const jobs = await this.publisher.zRangeByScore(queueKey, 0, now, {
        LIMIT: { offset: 0, count: 20 },
      });

      for (const jobStr of jobs) {
        try {
          const job = JSON.parse(jobStr) as QueueMessage;

          // Emit event for job processing
          this.eventEmitter.emit(`delayed_job:${job.type}`, job.payload);

          // Remove from queue
          await this.publisher.zRem(queueKey, jobStr);
        } catch (error) {
          console.error('Failed to process delayed job:', error);
        }
      }
    } catch (error) {
      console.error('Failed to process delayed jobs:', error);
    }
  }

  /**
   * 큐 통계 조회
   */
  async getQueueStats(): Promise<Record<string, any>> {
    if (!this.isConnected) return {};

    try {
      const stats: Record<string, any> = {};

      // Get offline message stats
      const offlineKeys = await this.publisher.keys('offline_messages:*');
      stats.offlineMessages = offlineKeys.length;

      // Get retry queue size
      const retryQueueSize = await this.publisher.zCard(
        'push_notification_retry_queue',
      );
      stats.retryQueueSize = retryQueueSize;

      // Get delayed jobs size
      const delayedJobsSize = await this.publisher.zCard('delayed_jobs');
      stats.delayedJobsSize = delayedJobsSize;

      // Get batch job stats
      const batchJobKeys = await this.publisher.keys('batch_jobs:*');
      stats.batchJobQueues = {};

      for (const key of batchJobKeys) {
        const jobType = key.split(':')[1];
        const size = await this.publisher.lLen(key);
        stats.batchJobQueues[jobType] = size;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return {};
    }
  }
}
