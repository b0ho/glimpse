/**
 * @module notificationRoutes
 * @description 알림 관리 API 라우트 모듈
 * 
 * 이 모듈은 사용자 알림 시스템을 관리하는 API 엔드포인트들을 제공합니다.
 * 앱 내 알림 시스템과 연동되어 사용자에게 실시간 알림을 제공하며, 다음과 같은 기능을 포함합니다:
 * - 알림 목록 조회
 * - 읽지 않은 알림 수 확인
 * - 알림 읽음 처리 (개별/전체)
 * - 알림 삭제
 * - 테스트 알림 전송
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authenticateUser } from '../middleware/auth';

/**
 * 알림 관리 API 라우터
 * @description 알림 관리 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
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