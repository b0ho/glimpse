import express from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const paymentController = new PaymentController();

// Payment routes
router.post('/create', authMiddleware, paymentController.createPayment);
router.post('/process/:paymentId', authMiddleware, paymentController.processPayment);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);
router.get('/verify/:paymentId', authMiddleware, paymentController.verifyPayment);
router.post('/refund/:paymentId', authMiddleware, paymentController.refundPayment);

// Webhook endpoints (no auth required)
router.post('/webhook/toss', paymentController.webhookToss);
router.post('/webhook/kakao', paymentController.webhookKakao);

// Subscription management
router.get('/subscription/current', authMiddleware, paymentController.getCurrentSubscription);
router.post('/subscription/cancel', authMiddleware, paymentController.cancelSubscription);

// Pricing and payment methods
router.get('/methods', authMiddleware, paymentController.getPaymentMethods);
router.get('/packages', authMiddleware, paymentController.getPricingPackages);

export default router;