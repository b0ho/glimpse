import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// 알림 목록 조회
router.get(
  '/',
  authenticateUser,
  notificationController.getNotifications.bind(notificationController)
);

// 읽지 않은 알림 개수 조회
router.get(
  '/unread-count',
  authenticateUser,
  notificationController.getUnreadCount.bind(notificationController)
);

// 특정 알림을 읽음으로 표시
router.put(
  '/:notificationId/read',
  authenticateUser,
  notificationController.markAsRead.bind(notificationController)
);

// 모든 알림을 읽음으로 표시
router.put(
  '/read-all',
  authenticateUser,
  notificationController.markAllAsRead.bind(notificationController)
);

// 알림 삭제
router.delete(
  '/:notificationId',
  authenticateUser,
  notificationController.deleteNotification.bind(notificationController)
);

// 테스트 알림 전송
router.post(
  '/test',
  authenticateUser,
  notificationController.testNotification.bind(notificationController)
);

export default router;