import { Router } from 'express';
import { clerkAuthMiddleware } from '../middleware/clerkAuth';
import { userController } from '../controllers/UserController';
import { validate, validators } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: 현재 사용자 정보 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', clerkAuthMiddleware, userController.getCurrentUser);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: 프로필 업데이트
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *               age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 100
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               profileImage:
 *                 type: string
 *                 format: url
 *     responses:
 *       200:
 *         description: 업데이트된 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/profile', 
  clerkAuthMiddleware,
  validate([
    validators.nickname.optional(),
    validators.age.optional(),
    validators.bio.optional()
  ]),
  userController.updateProfile
);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: 특정 사용자 정보 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 정보 (익명 처리됨)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 anonymousId:
 *                   type: string
 *                 nickname:
 *                   type: string
 *                 age:
 *                   type: integer
 *                 gender:
 *                   type: string
 *                 bio:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:userId', 
  clerkAuthMiddleware,
  validate([validators.userId]),
  userController.getUserById
);

/**
 * @swagger
 * /users/verify/company:
 *   post:
 *     summary: 회사 인증 요청
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *               - method
 *             properties:
 *               companyId:
 *                 type: string
 *                 format: uuid
 *               method:
 *                 type: string
 *                 enum: [EMAIL_DOMAIN, OCR_VERIFICATION, INVITE_CODE]
 *               data:
 *                 type: object
 *                 description: 인증 방법에 따른 추가 데이터
 *     responses:
 *       200:
 *         description: 인증 요청 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 verificationId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/verify/company', 
  clerkAuthMiddleware, 
  userController.verifyCompany
);

/**
 * @swagger
 * /users/premium/subscribe:
 *   post:
 *     summary: 프리미엄 구독
 *     tags: [Users, Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *               - paymentMethodId
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [MONTHLY, YEARLY]
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *     responses:
 *       200:
 *         description: 구독 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   type: object
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       402:
 *         description: 결제 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/premium/subscribe', 
  clerkAuthMiddleware, 
  userController.subscribePremium
);

/**
 * @swagger
 * /users/credits/purchase:
 *   post:
 *     summary: 좋아요 크레딧 구매
 *     tags: [Users, Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - package
 *               - paymentMethod
 *             properties:
 *               package:
 *                 type: string
 *                 enum: [SMALL, MEDIUM, LARGE, MEGA]
 *                 description: |
 *                   - SMALL: 5개 (₩2,500)
 *                   - MEDIUM: 10개 (₩4,500)
 *                   - LARGE: 20개 (₩8,500)
 *                   - MEGA: 50개 (₩19,000)
 *               paymentMethod:
 *                 type: string
 *                 enum: [CARD, KAKAO_PAY, TOSS_PAY, NAVER_PAY]
 *     responses:
 *       200:
 *         description: 구매 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 credits:
 *                   type: integer
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 */
router.post('/credits/purchase', 
  clerkAuthMiddleware, 
  userController.purchaseCredits
);

/**
 * @swagger
 * /users:
 *   delete:
 *     summary: 계정 삭제
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 탈퇴 사유
 *     responses:
 *       204:
 *         description: 계정 삭제 완료
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/', 
  clerkAuthMiddleware, 
  userController.deleteAccount
);

export default router;