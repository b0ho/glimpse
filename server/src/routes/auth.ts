import express from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import { AuthController } from '../controllers/AuthController';

const router = express.Router();
const authController = new AuthController();

// Apply auth rate limiting to all auth routes
router.use(authLimiter);

// SMS Authentication (Korean phone numbers)
router.post('/send-sms', authController.sendSMS);
router.post('/verify-sms', authController.verifySMS);

// JWT Token operations
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// User registration after SMS verification
router.post('/register', authController.register);

export default router;