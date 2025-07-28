import express from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authMiddleware } from '../middleware/auth';
import { paymentRetryService } from '../services/PaymentRetryService';
import { idempotent, requireIdempotencyKey } from '../middleware/idempotency';

const router = express.Router();
const paymentController = new PaymentController();

// Payment routes (with idempotency protection)
router.post('/create', authMiddleware, requireIdempotencyKey, idempotent(), paymentController.createPayment);
router.post('/process/:paymentId', authMiddleware, requireIdempotencyKey, idempotent(), paymentController.processPayment);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);
router.get('/verify/:paymentId', authMiddleware, paymentController.verifyPayment);
router.post('/refund/:paymentId', authMiddleware, requireIdempotencyKey, idempotent(), paymentController.refundPayment);

// Webhook endpoints (no auth required)
router.post('/webhook/toss', paymentController.webhookToss);
router.post('/webhook/kakao', paymentController.webhookKakao);

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
    const userId = req.user!.id;
    
    const result = await paymentRetryService.processPaymentWithRetry(
      paymentId,
      userId,
      req.body
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