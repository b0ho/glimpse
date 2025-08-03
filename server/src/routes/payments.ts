/**
 * @module payments
 * @description 결제 시스템 API 라우트 모듈
 * 
 * 이 모듈은 한국 시장에 최적화된 결제 시스템을 관리하는 API 엔드포인트들을 제공합니다.
 * TossPay, KakaoPay 등 한국의 주요 결제 게이트웨이와 연동되어 있으며, 다음과 같은 기능을 포함합니다:
 * - 결제 생성 및 처리
 * - 결제 내역 및 검증
 * - 구독 관리 (프리미엄)
 * - 웹훅 처리
 * - 결제 재시도 및 환불
 * - 뚜등성 보장 및 속도 제한
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import express from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authMiddleware } from '../middleware/auth';
import { paymentRetryService } from '../services/PaymentRetryService';
import { idempotent, requireIdempotencyKey } from '../middleware/idempotency';
import { paymentCreationLimiter, webhookLimiter } from '../middleware/specificRateLimiters';

/**
 * 결제 시스템 API 라우터
 * @description 결제 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
const router = express.Router();

/**
 * 결제 컸트롤러 인스턴스
 * @description 결제 관련 비즈니스 로직을 처리하는 컸트롤러
 * @type {PaymentController}
 */
const paymentController = new PaymentController();

// Payment routes (with idempotency protection and rate limiting)
router.post('/create', authMiddleware, paymentCreationLimiter, requireIdempotencyKey, idempotent(), paymentController.createPayment);
router.post('/process/:paymentId', authMiddleware, paymentCreationLimiter, requireIdempotencyKey, idempotent(), paymentController.processPayment);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);
router.get('/verify/:paymentId', authMiddleware, paymentController.verifyPayment);
router.post('/refund/:paymentId', authMiddleware, requireIdempotencyKey, idempotent(), paymentController.refundPayment);

// Webhook endpoints (no auth required, with rate limiting)
router.post('/webhook/toss', webhookLimiter, paymentController.webhookToss);
router.post('/webhook/kakao', webhookLimiter, paymentController.webhookKakao);

// Subscription management
router.get('/subscription/current', authMiddleware, paymentController.getCurrentSubscription);
router.post('/subscription/cancel', authMiddleware, paymentController.cancelSubscription);

// Pricing and payment methods
router.get('/methods', authMiddleware, paymentController.getPaymentMethods);
router.get('/packages', authMiddleware, paymentController.getPricingPackages);

// Retry endpoints (with idempotency)
router.post('/retry/:paymentId', authMiddleware, idempotent(), async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const userId = (req as any).user!.id;
    
    const result = await paymentRetryService.processPaymentWithRetry(
      paymentId,
      userId
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/retry/pending', authMiddleware, async (req, res, next) => {
  try {
    const pendingRetries = await paymentRetryService.getPendingRetries();
    res.json(pendingRetries);
  } catch (error) {
    next(error);
  }
});

export default router;