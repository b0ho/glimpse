/**
 * @module admin
 * @description 관리자 전용 API 라우트 모듈
 * 
 * 이 모듈은 관리자가 시스템 전반을 관리할 수 있는 API 엔드포인트들을 제공합니다.
 * 모든 엔드포인트는 관리자 권한 인증이 필요하며, 다음과 같은 기능을 포함합니다:
 * - 대시보드 통계 조회
 * - 사용자 관리 (차단/해제)
 * - 그룹 관리 (활성화/비활성화)
 * - 신고 관리
 * - 매출 및 사용자 활동 분석
 * - 시스템 설정 관리
 * - SMS 서비스 관리
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { authenticate } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

/**
 * 관리자 API 라우터
 * @description 관리자 권한이 필요한 모든 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
const router = Router();

// 모든 관리자 라우트에 인증 및 관리자 권한 확인 적용
router.use(authenticate);
router.use(adminAuth);

// 대시보드
router.get('/dashboard/stats', adminController.getDashboardStats);

// 사용자 관리
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserDetail);
router.put('/users/:userId/block', adminController.toggleUserBlock);

// 그룹 관리
router.get('/groups', adminController.getGroups);
router.put('/groups/:groupId/active', adminController.toggleGroupActive);

// 신고 관리
router.get('/reports', adminController.getReports);

// 분석
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/user-activity', adminController.getUserActivityAnalytics);

// 시스템 설정
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

// SMS 관리
router.get('/sms/balance', async (req, res, next) => {
  try {
    const { smsService } = await import('../services/SMSService');
    const balance = await smsService.checkBalance();
    res.json(balance);
  } catch (error) {
    next(error);
  }
});

router.get('/sms/statistics', async (req, res, next) => {
  try {
    const { smsService } = await import('../services/SMSService');
    const days = parseInt(req.query.days as string) || 7;
    const stats = await smsService.getStatistics(days);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;