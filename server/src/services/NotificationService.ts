import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { FirebaseService } from './FirebaseService';
import { NOTIFICATION_TYPES } from '../../../shared/constants';


const firebaseService = new FirebaseService();

export class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {}
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // FCM 토큰 관리
  async registerFCMToken(userId: string, token: string, deviceType: 'ios' | 'android'): Promise<void> {
    try {
      // 기존 토큰이 있는지 확인
      const existingToken = await prisma.fcmToken.findUnique({
        where: { token }
      });

      if (existingToken) {
        // 다른 사용자의 토큰이면 비활성화
        if (existingToken.userId !== userId) {
          await prisma.fcmToken.update({
            where: { id: existingToken.id },
            data: { isActive: false }
          });
        } else {
          // 같은 사용자의 토큰이면 활성화
          await prisma.fcmToken.update({
            where: { id: existingToken.id },
            data: { isActive: true, updatedAt: new Date() }
          });
          return;
        }
      }

      // 같은 사용자의 다른 디바이스 토큰 비활성화 (선택적)
      // 한 사용자가 여러 디바이스를 사용할 수 있으므로 필요에 따라 조정
      
      // 새 토큰 등록
      await prisma.fcmToken.create({
        data: {
          userId,
          token,
          deviceType,
          isActive: true
        }
      });
    } catch (error) {
      console.error('FCM 토큰 등록 실패:', error);
      throw createError(500, 'FCM 토큰 등록에 실패했습니다.');
    }
  }

  async removeFCMToken(token: string): Promise<void> {
    try {
      await prisma.fcmToken.update({
        where: { token },
        data: { isActive: false }
      });
    } catch (error) {
      console.error('FCM 토큰 제거 실패:', error);
    }
  }

  async getActiveTokens(userId: string): Promise<string[]> {
    const tokens = await prisma.fcmToken.findMany({
      where: {
        userId,
        isActive: true
      },
      select: { token: true }
    });

    return tokens.map(t => t.token);
  }
  async sendLikeNotification(userId: string, fromUserId: string, groupId: string) {
    try {
      const [toUser, fromUser, group] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.user.findUnique({ where: { id: fromUserId } }),
        prisma.group.findUnique({ where: { id: groupId } })
      ]);

      if (!toUser || !fromUser || !group) return null;

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'LIKE_RECEIVED',
          title: NOTIFICATION_TYPES.LIKE_RECEIVED.title,
          message: `${group.name}에서 누군가 당신을 좋아합니다!`,
          data: {
            fromUserId,
            groupId,
            groupName: group.name
          }
        }
      });

      // Send push notification
      await this.sendPushNotification(userId, {
        title: notification.title,
        body: notification.message,
        data: {
          type: 'LIKE_RECEIVED',
          notificationId: notification.id,
          fromUserId,
          groupId
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to send like notification:', error);
      return null;
    }
  }

  async sendMatchNotification(userId: string, matchedUserId: string, matchId: string) {
    try {
      const [user, matchedUser] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.user.findUnique({ where: { id: matchedUserId } })
      ]);

      if (!user || !matchedUser) return null;

      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'MATCH_CREATED',
          title: NOTIFICATION_TYPES.MATCH_CREATED.title,
          message: `${matchedUser.nickname || '익명의 사용자'}님과 매치되었습니다!`,
          data: {
            matchId,
            matchedUserId,
            matchedUserNickname: matchedUser.nickname
          }
        }
      });

      await this.sendPushNotification(userId, {
        title: notification.title,
        body: notification.message,
        data: {
          type: 'MATCH_CREATED',
          notificationId: notification.id,
          matchId,
          matchedUserId
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to send match notification:', error);
      return null;
    }
  }

  async sendMessageNotification(userId: string, fromUserId: string, matchId: string, messagePreview: string) {
    try {
      const fromUser = await prisma.user.findUnique({ where: { id: fromUserId } });
      if (!fromUser) return null;

      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'MESSAGE_RECEIVED',
          title: `${fromUser.nickname || '매치된 사용자'}님의 메시지`,
          message: messagePreview.length > 50 ? `${messagePreview.substring(0, 50)}...` : messagePreview,
          data: {
            fromUserId,
            matchId,
            fromUserNickname: fromUser.nickname
          }
        }
      });

      await this.sendPushNotification(userId, {
        title: notification.title,
        body: notification.message,
        data: {
          type: 'MESSAGE_RECEIVED',
          notificationId: notification.id,
          matchId,
          fromUserId
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to send message notification:', error);
      return null;
    }
  }

  async sendGroupInvitationNotification(userId: string, groupId: string, invitedBy: string) {
    try {
      const [group, inviter] = await Promise.all([
        prisma.group.findUnique({ where: { id: groupId } }),
        prisma.user.findUnique({ where: { id: invitedBy } })
      ]);

      if (!group || !inviter) return null;

      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'GROUP_INVITATION',
          title: NOTIFICATION_TYPES.GROUP_INVITATION.title,
          message: `${inviter.nickname || '사용자'}님이 "${group.name}" 그룹에 초대했습니다.`,
          data: {
            groupId,
            groupName: group.name,
            invitedBy,
            inviterNickname: inviter.nickname
          }
        }
      });

      await this.sendPushNotification(userId, {
        title: notification.title,
        body: notification.message,
        data: {
          type: 'GROUP_INVITATION',
          notificationId: notification.id,
          groupId,
          invitedBy
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to send group invitation notification:', error);
      return null;
    }
  }

  async sendVerificationStatusNotification(userId: string, isApproved: boolean, companyName: string) {
    try {
      const type = isApproved ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED';
      const config = NOTIFICATION_TYPES[type];

      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title: config.title,
          message: isApproved 
            ? `${companyName} 인증이 승인되었습니다!`
            : `${companyName} 인증이 거절되었습니다.`,
          data: {
            companyName,
            isApproved
          }
        }
      });

      await this.sendPushNotification(userId, {
        title: notification.title,
        body: notification.message,
        data: {
          type,
          notificationId: notification.id,
          companyName
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to send verification status notification:', error);
      return null;
    }
  }

  async sendPaymentSuccessNotification(userId: string, amount: number, type: 'PREMIUM' | 'CREDITS', credits?: number) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'PAYMENT_SUCCESS',
          title: '결제 완료',
          message: type === 'PREMIUM' 
            ? `프리미엄 멤버십 결제가 완료되었습니다! (₩${amount.toLocaleString()})`
            : `크레딧 ${credits}개 결제가 완료되었습니다! (₩${amount.toLocaleString()})`,
          data: {
            amount,
            type,
            credits: credits || null
          }
        }
      });

      await this.sendPushNotification(userId, {
        title: notification.title,
        body: notification.message,
        data: {
          type: 'PAYMENT_SUCCESS',
          notificationId: notification.id,
          amount: amount.toString(),
          paymentType: type
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to send payment success notification:', error);
      return null;
    }
  }

  async sendPurchaseNotification(userId: string, credits: number, amount: number) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'PAYMENT_SUCCESS',
          title: '크레딧 구매 완료',
          message: `${credits}개의 크레딧을 구매했습니다.`,
          data: {
            credits,
            amount
          }
        }
      });

      await this.sendPushNotification(userId, {
        title: notification.title,
        body: notification.message,
        data: {
          type: 'PAYMENT_SUCCESS',
          credits: credits.toString(),
          amount: amount.toString()
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to send purchase notification:', error);
      return null;
    }
  }

  async sendSubscriptionNotification(userId: string, plan: string) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'PAYMENT_SUCCESS',
          title: '프리미엄 구독 시작',
          message: `프리미엄 ${plan === 'MONTHLY' ? '월간' : '연간'} 구독이 시작되었습니다.`,
          data: {
            plan
          }
        }
      });

      await this.sendPushNotification(userId, {
        title: notification.title,
        body: notification.message,
        data: {
          type: 'SUBSCRIPTION_STARTED',
          plan
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to send subscription notification:', error);
      return null;
    }
  }

  async sendSubscriptionCancelledNotification(userId: string, expiresAt: Date) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'SUBSCRIPTION_CANCELLED',
          title: '구독 취소 완료',
          message: `프리미엄 구독이 취소되었습니다. ${expiresAt.toLocaleDateString('ko-KR')}까지 이용 가능합니다.`,
          data: {
            expiresAt: expiresAt.toISOString()
          }
        }
      });

      await this.sendPushNotification(userId, {
        title: notification.title,
        body: notification.message,
        data: {
          type: 'SUBSCRIPTION_CANCELLED',
          notificationId: notification.id,
          expiresAt: expiresAt.toISOString()
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to send subscription cancelled notification:', error);
      return null;
    }
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return notifications;
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw createError(404, '알림을 찾을 수 없습니다.');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return { message: '알림을 읽음으로 표시했습니다.' };
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return { message: '모든 알림을 읽음으로 표시했습니다.' };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  async sendCallNotification(
    receiverId: string,
    callerId: string,
    callerName: string,
    callType: 'video' | 'audio'
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'MESSAGE_RECEIVED', // Using existing type for now
          title: `${callerName}님의 ${callType === 'video' ? '영상' : '음성'} 통화`,
          message: '탭하여 통화에 응답하세요',
          data: {
            callerId,
            callerName,
            callType,
            notificationType: 'INCOMING_CALL'
          }
        }
      });

      await this.sendPushNotification(receiverId, {
        title: notification.title,
        body: notification.message,
        data: notification.data || {},
        priority: 'high',
        sound: 'ringtone.mp3'
      });

      return notification;
    } catch (error) {
      console.error('Failed to send call notification:', error);
      throw error;
    }
  }

  async sendMissedCallNotification(
    receiverId: string,
    callerId: string,
    callType: 'video' | 'audio'
  ) {
    try {
      const caller = await prisma.user.findUnique({
        where: { id: callerId },
        select: { nickname: true }
      });

      if (!caller) return null;

      const notification = await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'MESSAGE_RECEIVED', // Using existing type for now
          title: '부재중 통화',
          message: `${caller.nickname}님의 ${callType === 'video' ? '영상' : '음성'} 통화를 놓쳤습니다.`,
          data: {
            callerId,
            callType,
            notificationType: 'MISSED_CALL'
          }
        }
      });

      await this.sendPushNotification(receiverId, {
        title: notification.title,
        body: notification.message,
        data: notification.data || {}
      });

      return notification;
    } catch (error) {
      console.error('Failed to send missed call notification:', error);
      throw error;
    }
  }

  private async sendPushNotification(userId: string, payload: any) {
    try {
      await firebaseService.sendNotificationToUser({
        userId,
        payload: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          ...(payload.priority && { priority: payload.priority }),
          ...(payload.sound && { sound: payload.sound })
        }
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        throw createError(404, '알림을 찾을 수 없습니다.');
      }

      await prisma.notification.delete({
        where: { id: notificationId }
      });

      return { message: '알림이 삭제되었습니다.' };
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  async updateDeviceToken(userId: string, token: string, platform: string) {
    try {
      // Deactivate old tokens for this platform
      await prisma.userDeviceToken.updateMany({
        where: { userId, platform },
        data: { isActive: false }
      });

      // Create or update new token
      await prisma.userDeviceToken.upsert({
        where: { token },
        update: { isActive: true, updatedAt: new Date() },
        create: {
          userId,
          token,
          platform,
          isActive: true
        }
      });

      return { message: '디바이스 토큰이 업데이트되었습니다.' };
    } catch (error) {
      console.error('Failed to update device token:', error);
      throw error;
    }
  }
}

export const notificationService = NotificationService.getInstance();