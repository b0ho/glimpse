import express from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const paymentController = new PaymentController();

// Payment routes
router.post('/create-intent', authMiddleware, paymentController.createPaymentIntent);
router.post('/confirm', authMiddleware, paymentController.confirmPayment);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);

// Webhook endpoints (no auth required)
router.post('/webhook/stripe', paymentController.stripeWebhook);
router.post('/webhook/toss', paymentController.tossWebhook);
router.post('/webhook/kakao', paymentController.kakaoWebhook);

// Premium subscription
router.post('/premium/subscribe', authMiddleware, paymentController.subscribePremium);
router.post('/premium/cancel', authMiddleware, paymentController.cancelPremium);
router.get('/premium/status', authMiddleware, paymentController.getPremiumStatus);

export default router;