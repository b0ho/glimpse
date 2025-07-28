import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { authenticate } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

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