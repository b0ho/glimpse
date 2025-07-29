import Redis from 'ioredis';
import { logger } from '../middleware/logging';
import { EventEmitter } from 'events';

interface QueueMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  attempts: number;
  userId?: string;
  matchId?: string;
}

interface QueueOptions {
  maxRetries?: number;
  retryDelay?: number;
  ttl?: number;
}

export class MessageQueueService extends EventEmitter {
  private publisher: Redis;
  private subscriber: Redis;
  private isConnected: boolean = false;

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

  // Enqueue a message for offline users
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

  // Get offline messages for a user
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

  // Clear offline messages for a user
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

  // Enqueue failed push notification for retry
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

  // Process retry queue
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

  // Log failed notification for analysis
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

  // Publish real-time event
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

  // Subscribe to real-time events
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

  // Graceful shutdown
  async disconnect() {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit()
    ]);
    this.isConnected = false;
  }
}

export const messageQueueService = new MessageQueueService();