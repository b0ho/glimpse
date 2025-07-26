import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { validate, validators } from '../utils/validation';
import { authRateLimiter } from '../config/security';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimiter);

// Phone verification - with validation
router.post('/verify-phone', 
  validate([
    validators.phoneNumber
  ]),
  authController.sendSMS
);

// SMS verification - with validation
router.post('/verify-sms',
  validate([
    validators.phoneNumber,
    validators.body('code')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('인증 코드는 6자리 숫자여야 합니다')
  ]),
  authController.verifySMS
);

// Complete registration - with comprehensive validation
router.post('/register',
  validate([
    validators.phoneNumber,
    validators.nickname,
    validators.age,
    validators.gender,
    validators.bio
  ]),
  authController.register
);

// Refresh token - with validation
router.post('/refresh',
  validate([
    validators.body('refreshToken')
      .notEmpty()
      .withMessage('리프레시 토큰이 필요합니다')
      .isJWT()
      .withMessage('유효하지 않은 토큰 형식입니다')
  ]),
  authController.refreshToken
);

// Logout - no validation needed
router.post('/logout', authController.logout);

export default router;