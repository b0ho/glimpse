import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// FCM 토큰 관리
router.post('/fcm/register', authenticate, notificationController.registerFCMToken);
router.post('/fcm/remove', authenticate, notificationController.removeFCMToken);

// 알림 관리
router.get('/', authenticate, notificationController.getNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/:notificationId/read', authenticate, notificationController.markAsRead);
router.put('/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/:notificationId', authenticate, notificationController.deleteNotification);

// 테스트용 (개발 환경에서만 사용)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', authenticate, notificationController.testNotification);
}

export default router;