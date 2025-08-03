import { NotificationService } from '../NotificationService';
import { prismaMock } from '../../__tests__/setup';
import { createMockUser } from '../../__tests__/setup';
import { firebaseService } from '../FirebaseService';
import { createError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../FirebaseService', () => ({
  firebaseService: {
    sendNotification: jest.fn(),
    sendMulticastNotification: jest.fn(),
  },
}));

describe.skip('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = NotificationService.getInstance();
    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should send notification to user with FCM token', async () => {
      const userId = 'user-1';
      const notification = {
        title: 'Test Notification',
        body: 'This is a test message',
        data: { type: 'test' },
      };

      const mockUser = createMockUser({
        id: userId,
        fcmToken: 'fcm-token-123',
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (firebaseService.sendNotification as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      });

      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId,
        ...notification,
        status: 'SENT',
        createdAt: new Date(),
      } as any);

      const result = await notificationService.sendNotification(userId, notification);

      expect(result).toHaveProperty('status', 'SENT');
      expect(firebaseService.sendNotification).toHaveBeenCalledWith(
        'fcm-token-123',
        notification
      );
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          ...notification,
          status: 'SENT',
        },
      });
    });

    it('should save notification as PENDING if user has no FCM token', async () => {
      const userId = 'user-1';
      const notification = {
        title: 'Test Notification',
        body: 'This is a test message',
      };

      const mockUser = createMockUser({
        id: userId,
        fcmToken: null,
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId,
        ...notification,
        status: 'PENDING',
        createdAt: new Date(),
      } as any);

      const result = await notificationService.sendNotification(userId, notification);

      expect(result).toHaveProperty('status', 'PENDING');
      expect(firebaseService.sendNotification).not.toHaveBeenCalled();
    });

    it('should handle FCM send failure', async () => {
      const userId = 'user-1';
      const notification = {
        title: 'Test Notification',
        body: 'This is a test message',
      };

      const mockUser = createMockUser({
        id: userId,
        fcmToken: 'fcm-token-123',
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (firebaseService.sendNotification as jest.Mock).mockRejectedValue(
        new Error('FCM Error')
      );

      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId,
        ...notification,
        status: 'FAILED',
        createdAt: new Date(),
      } as any);

      const result = await notificationService.sendNotification(userId, notification);

      expect(result).toHaveProperty('status', 'FAILED');
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send notifications to multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const notification = {
        title: 'Bulk Notification',
        body: 'Sent to multiple users',
      };

      const mockUsers = [
        createMockUser({ id: 'user-1', fcmToken: 'token-1' }),
        createMockUser({ id: 'user-2', fcmToken: 'token-2' }),
        createMockUser({ id: 'user-3', fcmToken: null }), // No token
      ];

      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);
      (firebaseService.sendMulticastNotification as jest.Mock).mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [
          { success: true, messageId: 'msg-1' },
          { success: true, messageId: 'msg-2' },
        ],
      });

      prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

      const result = await notificationService.sendBulkNotifications(
        userIds,
        notification
      );

      expect(result).toEqual({
        total: 3,
        sent: 2,
        failed: 0,
        pending: 1,
      });

      expect(firebaseService.sendMulticastNotification).toHaveBeenCalledWith(
        ['token-1', 'token-2'],
        notification
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications for user', async () => {
      const userId = 'user-1';
      const mockNotifications = [
        {
          id: 'notif-1',
          userId,
          title: 'New Match!',
          body: 'You have a new match',
          status: 'SENT',
          readAt: null,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          userId,
          title: 'New Like',
          body: 'Someone liked you',
          status: 'SENT',
          readAt: new Date(),
          createdAt: new Date(),
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await notificationService.getUserNotifications(userId, 1, 10);

      expect(result).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notif-1';
      const userId = 'user-1';
      
      const mockNotification = {
        id: notificationId,
        userId,
        readAt: null,
      };

      prismaMock.notification.findUnique.mockResolvedValue(mockNotification as any);
      prismaMock.notification.update.mockResolvedValue({
        ...mockNotification,
        readAt: new Date(),
      } as any);

      const result = await notificationService.markAsRead(notificationId, userId);

      expect(result.readAt).toBeTruthy();
      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { readAt: expect.any(Date) },
      });
    });

    it('should throw error for unauthorized access', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'other-user',
      };

      prismaMock.notification.findUnique.mockResolvedValue(mockNotification as any);

      await expect(
        notificationService.markAsRead('notif-1', 'user-1')
      ).rejects.toThrow('알림을 찾을 수 없습니다.');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const userId = 'user-1';

      prismaMock.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await notificationService.markAllAsRead(userId);

      expect(result).toEqual({ count: 5 });
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          readAt: null,
        },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const userId = 'user-1';

      prismaMock.notification.count.mockResolvedValue(7);

      const result = await notificationService.getUnreadCount(userId);

      expect(result).toBe(7);
      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: {
          userId,
          readAt: null,
        },
      });
    });
  });

  describe('deleteOldNotifications', () => {
    it('should delete notifications older than 30 days', async () => {
      prismaMock.notification.deleteMany.mockResolvedValue({ count: 50 });

      const result = await notificationService.deleteOldNotifications();

      expect(result).toBe(50);
      expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe('sendPendingNotifications', () => {
    it('should retry sending pending notifications', async () => {
      const pendingNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          title: 'Pending Notification',
          body: 'This was pending',
          status: 'PENDING',
          user: createMockUser({ fcmToken: 'token-1' }),
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(pendingNotifications as any);
      (firebaseService.sendNotification as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      });
      prismaMock.notification.update.mockResolvedValue({} as any);

      const result = await notificationService.sendPendingNotifications();

      expect(result).toEqual({ sent: 1, failed: 0 });
      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { status: 'SENT' },
      });
    });
  });

  describe('notification templates', () => {
    it('should send new match notification', async () => {
      const userId = 'user-1';
      const matchedUserName = 'User2';

      prismaMock.user.findUnique.mockResolvedValue(
        createMockUser({ fcmToken: 'token-1' }) as any
      );
      (firebaseService.sendNotification as jest.Mock).mockResolvedValue({
        success: true,
      });
      prismaMock.notification.create.mockResolvedValue({} as any);

      await notificationService.sendNewMatchNotification(userId, matchedUserName);

      expect(firebaseService.sendNotification).toHaveBeenCalledWith(
        'token-1',
        expect.objectContaining({
          title: '새로운 매치! 🎉',
          body: `${matchedUserName}님과 매치되었습니다. 대화를 시작해보세요!`,
          data: { type: 'new_match' },
        })
      );
    });

    it('should send new message notification', async () => {
      const userId = 'user-1';
      const senderName = 'User2';
      const message = 'Hello!';

      prismaMock.user.findUnique.mockResolvedValue(
        createMockUser({ fcmToken: 'token-1' }) as any
      );
      (firebaseService.sendNotification as jest.Mock).mockResolvedValue({
        success: true,
      });
      prismaMock.notification.create.mockResolvedValue({} as any);

      await notificationService.sendNewMessageNotification(userId, senderName, message);

      expect(firebaseService.sendNotification).toHaveBeenCalledWith(
        'token-1',
        expect.objectContaining({
          title: `${senderName}님의 새 메시지`,
          body: message,
          data: { type: 'new_message' },
        })
      );
    });

    it('should send daily credit notification', async () => {
      const userId = 'user-1';

      prismaMock.user.findUnique.mockResolvedValue(
        createMockUser({ fcmToken: 'token-1' }) as any
      );
      (firebaseService.sendNotification as jest.Mock).mockResolvedValue({
        success: true,
      });
      prismaMock.notification.create.mockResolvedValue({} as any);

      await notificationService.sendDailyCreditNotification(userId);

      expect(firebaseService.sendNotification).toHaveBeenCalledWith(
        'token-1',
        expect.objectContaining({
          title: '일일 크레딧이 지급되었습니다! 💎',
          body: '오늘의 무료 좋아요를 사용해보세요.',
          data: { type: 'daily_credit' },
        })
      );
    });
  });
});