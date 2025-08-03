/**
 * @module notifications
 * @description FCM 푸시 알림 API 라우트 모듈
 * 
 * 이 모듈은 Firebase Cloud Messaging(FCM)을 활용한 푸시 알림 시스템을 관리하는 API 엔드포인트들을 제공합니다.
 * iOS와 Android 디바이스에 실시간 푸시 알림을 전송하며, 다음과 같은 기능을 포함합니다:
 * - FCM 토큰 등록 및 제거
 * - 알림 목록 및 읽음 상태 관리
 * - 알림 읽음 처리 (개별/전체)
 * - 알림 삭제 기능
 * - 개발 환경 테스트 알림
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authenticate } from '../middleware/auth';

/**
 * FCM 알림 API 라우터
 * @description FCM 푸시 알림 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
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