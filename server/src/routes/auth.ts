/**
 * 인증 라우트
 * @module routes/auth
 * @description SMS 인증, 회원가입, 토큰 갱신 등 인증 관련 API 엔드포인트
 */

import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { validate, validators } from '../utils/validation';
import { authRateLimiter } from '../config/security';

/**
 * 인증 라우터 인스턴스
 * @constant router
 * @type {Router}
 * @description 모든 인증 관련 라우트에 rate limiting 적용
 */
const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimiter);

/**
 * @swagger
 * /auth/verify-phone:
 *   post:
 *     summary: 전화번호 인증 요청
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 pattern: ^010-\d{4}-\d{4}$
 *                 example: "010-1234-5678"
 *     responses:
 *       200:
 *         description: SMS 발송 성공
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/verify-phone', 
  validate([
    validators.phoneNumber
  ]),
  authController.sendSMS
);

/**
 * @swagger
 * /auth/verify-sms:
 *   post:
 *     summary: SMS 인증 코드 확인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 pattern: ^010-\d{4}-\d{4}$
 *               code:
 *                 type: string
 *                 pattern: ^\d{6}$
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 인증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 회원가입 완료
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - nickname
 *               - age
 *               - gender
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 pattern: ^010-\d{4}-\d{4}$
 *               nickname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *               age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 100
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE]
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: 이미 존재하는 사용자
 */
router.post('/register',
  validate([
    validators.phoneNumber,
    validators.nickname,
    validators.age,
    validators.gender,
    validators.bio.optional()
  ]),
  authController.register
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 format: jwt
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: 로그아웃 성공
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', authController.logout);

// Alias routes for backward compatibility
router.post('/send-sms', authController.sendSMS);
router.post('/verify-sms', authController.verifySMS);
router.post('/refresh-token', authController.refreshToken);

export default router;