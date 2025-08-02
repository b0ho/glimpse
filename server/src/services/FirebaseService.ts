import admin from 'firebase-admin';
import { prisma } from "../config/database";
import path from 'path';



/**
 * 알림 페이로드 인터페이스
 * @interface NotificationPayload
 */
interface NotificationPayload {
  /** 알림 제목 */
  title: string;
  /** 알림 본문 */
  body: string;
  /** 알림 아이콘 */
  icon?: string;
  /** 알림 이미지 */
  image?: string;
  /** 알림 사운드 */
  sound?: string;
  /** 뱃지 숫자 (iOS) */
  badge?: number;
  /** 추가 데이터 */
  data?: Record<string, string>;
}

/**
 * 알림 전송 옵션 인터페이스
 * @interface SendNotificationOptions
 */
interface SendNotificationOptions {
  /** 사용자 ID */
  userId: string;
  /** 알림 페이로드 */
  payload: NotificationPayload;
  /** 주제 (토픽) */
  topic?: string;
  /** 조건식 */
  condition?: string;
}

/**
 * Firebase 푸시 알림 서비스
 * @class FirebaseService
 */
export class FirebaseService {
  /** Firebase 초기화 상태 */
  private initialized = false;

  constructor() {
    this.initializeFirebase();
  }

  /**
   * Firebase Admin SDK 초기화
   * @private
   * @returns {void}
   */
  private initializeFirebase() {
    try {
      if (!admin.apps.length) {
        const serviceAccountPath = process.env.FCM_CREDENTIALS_PATH;
        
        if (serviceAccountPath && serviceAccountPath.trim() !== '') {
          const serviceAccount = require(path.resolve(serviceAccountPath));
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
          });
        } else {
          // Use default credentials if path not provided
          const projectId = process.env.FIREBASE_PROJECT_ID;
          if (projectId) {
            admin.initializeApp({
              credential: admin.credential.applicationDefault(),
              projectId
            });
          } else {
            console.warn('FIREBASE_PROJECT_ID not configured');
            return;
          }
        }
      }
      
      this.initialized = true;
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      this.initialized = false;
    }
  }

  /**
   * 특정 사용자에게 푸시 알림 전송
   * @param {SendNotificationOptions} options - 알림 전송 옵션
   * @returns {Promise<boolean>} 전송 성공 여부
   */
  async sendNotificationToUser(options: SendNotificationOptions): Promise<boolean> {
    if (!this.initialized) {
      console.warn('Firebase not initialized, skipping notification');
      return false;
    }

    try {
      // Get user's FCM tokens
      const tokens = await this.getUserFCMTokens(options.userId);
      
      if (tokens.length === 0) {
        console.log(`No FCM tokens found for user ${options.userId}`);
        return false;
      }

      const message = {
        notification: {
          title: options.payload.title,
          body: options.payload.body,
          imageUrl: options.payload.image
        },
        data: {
          ...(options.payload.data || {}),
          userId: options.userId,
          timestamp: Date.now().toString()
        },
        android: {
          notification: {
            icon: options.payload.icon || 'ic_notification',
            sound: options.payload.sound || 'default',
            channelId: 'default',
            priority: 'high' as const
          }
        },
        apns: {
          payload: {
            aps: {
              sound: options.payload.sound || 'default',
              badge: options.payload.badge || 1
            }
          }
        },
        tokens
      };

      const response = await admin.messaging().sendMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
            if (resp.error?.code === 'messaging/registration-token-not-registered') {
              const token = tokens[idx];
              if (token) {
                failedTokens.push(token);
              }
            }
          }
        });

        // Remove invalid tokens
        if (failedTokens.length > 0) {
          await this.removeUserFCMTokens(options.userId, failedTokens);
        }
      }

      console.log(`Successfully sent notification to ${response.successCount} devices`);
      
      // Notification record is saved by NotificationService
      
      return response.successCount > 0;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * 대량 알림 전송
   * @param {SendNotificationOptions[]} notifications - 알림 목록
   * @returns {Promise<number>} 성공적으로 전송된 알림 수
   */
  async sendBulkNotifications(notifications: SendNotificationOptions[]): Promise<number> {
    let successCount = 0;
    
    // Process in batches to avoid rate limits
    const batchSize = 500;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const promises = batch.map(notification => 
        this.sendNotificationToUser(notification)
      );
      
      const results = await Promise.allSettled(promises);
      successCount += results.filter(result => 
        result.status === 'fulfilled' && result.value
      ).length;
      
      // Wait between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return successCount;
  }

  /**
   * 특정 주제 구독자들에게 알림 전송
   * @param {string} topic - 주제명
   * @param {NotificationPayload} payload - 알림 페이로드
   * @returns {Promise<boolean>} 전송 성공 여부
   */
  async sendNotificationToTopic(topic: string, payload: NotificationPayload): Promise<boolean> {
    if (!this.initialized) {
      console.warn('Firebase not initialized, skipping topic notification');
      return false;
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.image
        },
        data: payload.data || {},
        topic
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent topic notification:', response);
      return true;
    } catch (error) {
      console.error('Error sending topic notification:', error);
      return false;
    }
  }

  /**
   * FCM 토큰을 특정 주제에 구독
   * @param {string[]} tokens - FCM 토큰 목록
   * @param {string} topic - 구독할 주제
   * @returns {Promise<boolean>} 구독 성공 여부
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(`Successfully subscribed ${response.successCount} tokens to topic ${topic}`);
      return response.successCount > 0;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  /**
   * FCM 토큰을 특정 주제에서 구독 해제
   * @param {string[]} tokens - FCM 토큰 목록
   * @param {string} topic - 구독 해제할 주제
   * @returns {Promise<boolean>} 구독 해제 성공 여부
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      console.log(`Successfully unsubscribed ${response.successCount} tokens from topic ${topic}`);
      return response.successCount > 0;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }

  /**
   * 사용자 FCM 토큰 추가
   * @param {string} userId - 사용자 ID
   * @param {string} token - FCM 토큰
   * @param {'ios' | 'android'} deviceType - 디바이스 타입
   * @returns {Promise<void>}
   */
  async addUserFCMToken(userId: string, token: string, deviceType: 'ios' | 'android'): Promise<void> {
    try {
      // Check if token already exists
      const existingToken = await prisma.fcmToken.findFirst({
        where: { userId, token }
      });

      if (!existingToken) {
        await prisma.fcmToken.create({
          data: {
            userId,
            token,
            deviceType,
            isActive: true
          }
        });
        
        console.log(`Added FCM token for user ${userId}`);
      } else {
        // Update existing token
        await prisma.fcmToken.update({
          where: { id: existingToken.id },
          data: {
            isActive: true,
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error adding FCM token:', error);
    }
  }

  /**
   * 사용자 FCM 토큰 제거
   * @param {string} userId - 사용자 ID
   * @param {string} token - 제거할 FCM 토큰
   * @returns {Promise<void>}
   */
  async removeUserFCMToken(userId: string, token: string): Promise<void> {
    try {
      await prisma.fcmToken.deleteMany({
        where: { userId, token }
      });
      
      console.log(`Removed FCM token for user ${userId}`);
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  /**
   * 사용자 FCM 토큰 일괄 제거
   * @param {string} userId - 사용자 ID
   * @param {string[]} tokens - 제거할 FCM 토큰 목록
   * @returns {Promise<void>}
   */
  async removeUserFCMTokens(userId: string, tokens: string[]): Promise<void> {
    try {
      await prisma.fcmToken.deleteMany({
        where: {
          userId,
          token: { in: tokens }
        }
      });
      
      console.log(`Removed ${tokens.length} FCM tokens for user ${userId}`);
    } catch (error) {
      console.error('Error removing FCM tokens:', error);
    }
  }

  /**
   * 사용자의 활성 FCM 토큰 목록 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<string[]>} FCM 토큰 목록
   */
  async getUserFCMTokens(userId: string): Promise<string[]> {
    try {
      const tokens = await prisma.fcmToken.findMany({
        where: {
          userId,
          isActive: true
        },
        select: { token: true }
      });
      
      return tokens.map(t => t.token);
    } catch (error) {
      console.error('Error getting FCM tokens:', error);
      return [];
    }
  }

  /**
   * 비활성 FCM 토큰 정리
   * @returns {Promise<number>} 정리된 토큰 수
   */
  async cleanupInactiveFCMTokens(): Promise<number> {
    if (!this.initialized) {
      return 0;
    }

    try {
      // Get all active tokens
      const tokens = await prisma.fcmToken.findMany({
        where: { isActive: true }
      });

      const inactiveTokens: string[] = [];
      const batchSize = 500;

      // Check tokens in batches
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        
        try {
          // Try to send a test message to check token validity
          const testMessage = {
            tokens: batch.map(t => t.token),
            data: { test: 'true' },
            dryRun: true // Don't actually send
          };

          const response = await admin.messaging().sendMulticast(testMessage);
          
          response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
              const tokenData = batch[idx];
              if (tokenData) {
                inactiveTokens.push(tokenData.token);
              }
            }
          });
        } catch (error) {
          console.error('Error checking token batch:', error);
        }
      }

      // Remove inactive tokens
      if (inactiveTokens.length > 0) {
        await prisma.fcmToken.deleteMany({
          where: {
            token: { in: inactiveTokens }
          }
        });
      }

      console.log(`Cleaned up ${inactiveTokens.length} inactive FCM tokens`);
      return inactiveTokens.length;
    } catch (error) {
      console.error('Error cleaning up FCM tokens:', error);
      return 0;
    }
  }






  /**
   * 예약된 알림 전송
   * @returns {Promise<number>} 전송된 알림 수
   */
  async sendScheduledNotifications(): Promise<number> {
    try {
      const scheduledNotifications = await prisma.scheduledNotification.findMany({
        where: {
          scheduledAt: { lte: new Date() },
          sent: false
        },
        include: {
          user: {
            select: { id: true }
          }
        }
      });

      let sentCount = 0;

      for (const notification of scheduledNotifications) {
        const success = await this.sendNotificationToUser({
          userId: notification.userId,
          payload: {
            title: notification.title,
            body: notification.body,
            data: notification.data as Record<string, string>
          }
        });

        if (success) {
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: { sent: true, sentAt: new Date() }
          });
          sentCount++;
        }
      }

      console.log(`Sent ${sentCount} scheduled notifications`);
      return sentCount;
    } catch (error) {
      console.error('Error sending scheduled notifications:', error);
      return 0;
    }
  }

  /**
   * 알림 예약
   * @param {string} userId - 사용자 ID
   * @param {NotificationPayload} payload - 알림 페이로드
   * @param {Date} scheduledAt - 예약 시간
   * @returns {Promise<string>} 예약된 알림 ID
   */
  async scheduleNotification(
    userId: string,
    payload: NotificationPayload,
    scheduledAt: Date
  ): Promise<string> {
    const notification = await prisma.scheduledNotification.create({
      data: {
        userId,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        scheduledAt,
        sent: false
      }
    });

    return notification.id;
  }

  /**
   * 예약된 알림 취소
   * @param {string} notificationId - 알림 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<boolean>} 취소 성공 여부
   */
  async cancelScheduledNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.scheduledNotification.deleteMany({
        where: {
          id: notificationId,
          userId,
          sent: false
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error canceling scheduled notification:', error);
      return false;
    }
  }

  /**
   * 매칭 알림 템플릿 생성
   * @param {string} matchedUserNickname - 매칭된 사용자 닉네임
   * @returns {NotificationPayload} 알림 페이로드
   */
  createMatchNotification(matchedUserNickname: string): NotificationPayload {
    return {
      title: '새로운 매치! 🎉',
      body: `${matchedUserNickname}님과 매칭되었습니다. 대화를 시작해보세요!`,
      icon: 'ic_match',
      sound: 'match_sound',
      data: {
        type: 'match',
        action: 'open_chat'
      }
    };
  }

  /**
   * 메시지 알림 템플릿 생성
   * @param {string} senderNickname - 발신자 닉네임
   * @param {string} message - 메시지 내용
   * @returns {NotificationPayload} 알림 페이로드
   */
  createMessageNotification(senderNickname: string, message: string): NotificationPayload {
    return {
      title: senderNickname,
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      icon: 'ic_message',
      sound: 'message_sound',
      data: {
        type: 'message',
        action: 'open_chat'
      }
    };
  }

  /**
   * 좋아요 알림 템플릿 생성
   * @returns {NotificationPayload} 알림 페이로드
   */
  createLikeNotification(): NotificationPayload {
    return {
      title: '누군가 당신을 좋아해요! 💖',
      body: '프리미엄으로 업그레이드하여 누가 좋아요를 눌렀는지 확인해보세요.',
      icon: 'ic_like',
      sound: 'like_sound',
      data: {
        type: 'like',
        action: 'view_likes'
      }
    };
  }

  /**
   * 그룹 초대 알림 템플릿 생성
   * @param {string} groupName - 그룹명
   * @returns {NotificationPayload} 알림 페이로드
   */
  createGroupInviteNotification(groupName: string): NotificationPayload {
    return {
      title: '그룹 초대 🎪',
      body: `${groupName} 그룹에 초대되었습니다.`,
      icon: 'ic_group',
      sound: 'default',
      data: {
        type: 'group_invite',
        action: 'view_group'
      }
    };
  }
}

export const firebaseService = new FirebaseService();