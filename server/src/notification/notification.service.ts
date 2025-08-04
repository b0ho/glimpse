import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { FirebaseService } from '../core/firebase/firebase.service';

interface NotificationData {
  userId: string;
  type: string;
  content: string;
  data?: any;
}

interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
}

/**
 * 알림 서비스
 * 
 * 인앱 알림 및 푸시 알림을 처리합니다.
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * 인앱 알림 전송
   * 
   * @param data 알림 데이터
   */
  async sendNotification(data: NotificationData) {
    const { userId, type, content, data: notificationData } = data;

    // 알림 생성
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: type as any, // TODO: fix NotificationType
        title: content,
        message: content,
        data: notificationData || {},
        isRead: false,
      },
    });

    // TODO: WebSocket을 통한 실시간 알림 전송
    // this.socketService.sendToUser(userId, 'notification', notification);

    return notification;
  }

  /**
   * 푸시 알림 전송
   * 
   * @param userId 사용자 ID
   * @param data 푸시 알림 데이터
   */
  async sendPushNotification(userId: string, data: PushNotificationData) {
    const { title, body, data: pushData } = data;

    // FCM 토큰 조회
    const fcmTokens = await this.prisma.fcmToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        token: true,
      },
    });

    if (fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return;
    }

    // Firebase를 통한 푸시 알림 전송
    const tokens = fcmTokens.map(t => t.token);
    try {
      // TODO: implement sendMulticast in FirebaseService
      // await this.firebaseService.sendMulticast({
      //   tokens,
      //   notification: {
      //     title,
      //     body,
      //   },
      //   data: pushData ? { ...pushData, userId } : { userId },
      // });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * 시스템 알림 전송
   * 
   * @param userId 사용자 ID
   * @param title 제목
   * @param message 메시지
   */
  async sendSystemNotification(userId: string, title: string, message: string) {
    await this.sendNotification({
      userId,
      type: 'SYSTEM',
      content: message,
      data: { title },
    });

    await this.sendPushNotification(userId, {
      title,
      body: message,
    });
  }

  /**
   * 알림 읽음 처리
   * 
   * @param userId 사용자 ID
   * @param notificationId 알림 ID
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * 모든 알림 읽음 처리
   * 
   * @param userId 사용자 ID
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * 알림 목록 조회
   * 
   * @param userId 사용자 ID
   * @param limit 조회 개수
   * @param offset 오프셋
   */
  async getNotifications(userId: string, limit: number = 20, offset: number = 0) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit,
      },
    };
  }

  /**
   * FCM 토큰 등록
   * 
   * @param userId 사용자 ID
   * @param token FCM 토큰
   * @param platform 플랫폼
   */
  async registerFcmToken(userId: string, token: string, platform: string) {
    // Check if token already exists
    const existingToken = await this.prisma.fcmToken.findUnique({
      where: { token },
    });

    if (existingToken) {
      return this.prisma.fcmToken.update({
        where: { token },
        data: {
          userId,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.fcmToken.create({
      data: {
        userId,
        token,
        isActive: true,
        deviceType: platform || 'UNKNOWN',
      },
    });
  }

  /**
   * FCM 토큰 비활성화
   * 
   * @param token FCM 토큰
   */
  async deactivateFcmToken(token: string) {
    return this.prisma.fcmToken.update({
      where: { token },
      data: { isActive: false },
    });
  }
}