/**
 * 사용자 라우트
 * @module routes/users
 * @description 프로필, 좋아요, 크레딧, 알림 설정 등 사용자 관련 API 엔드포인트
 */

import { Router } from 'express';
import { clerkAuthMiddleware } from '../middleware/clerkAuth';
import { userController } from '../controllers/UserController';
import { validate, validators } from '../utils/validation';
import { likeSendingLimiter, paymentCreationLimiter } from '../middleware/specificRateLimiters';

/**
 * 사용자 라우터 인스턴스
 * @constant router
 * @type {Router}
 * @description 인증된 사용자 전용 API 엔드포인트
 */
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
 *                 minLength: 1
 *                 maxLength: 40
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

/**
 * @swagger
 * /users/fcm/token:
 *   post:
 *     summary: FCM 토큰 등록
 *     tags: [Users, Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - deviceType
 *             properties:
 *               token:
 *                 type: string
 *                 description: FCM 등록 토큰
 *               deviceType:
 *                 type: string
 *                 enum: [ios, android]
 *                 description: 디바이스 타입
 *     responses:
 *       200:
 *         description: 토큰 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/fcm/token',
  clerkAuthMiddleware,
  userController.registerFCMToken
);

/**
 * @swagger
 * /users/fcm/token:
 *   delete:
 *     summary: FCM 토큰 제거
 *     tags: [Users, Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 제거할 FCM 토큰
 *     responses:
 *       200:
 *         description: 토큰 제거 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.delete('/fcm/token',
  clerkAuthMiddleware,
  userController.removeFCMToken
);

/**
 * @swagger
 * /users/notifications/settings:
 *   put:
 *     summary: 알림 설정 업데이트
 *     tags: [Users, Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pushEnabled:
 *                 type: boolean
 *                 description: 푸시 알림 활성화 여부
 *               newMessages:
 *                 type: boolean
 *                 description: 새 메시지 알림
 *               newMatches:
 *                 type: boolean
 *                 description: 새 매치 알림
 *               likes:
 *                 type: boolean
 *                 description: 좋아요 알림
 *               groupInvites:
 *                 type: boolean
 *                 description: 그룹 초대 알림
 *               marketing:
 *                 type: boolean
 *                 description: 마케팅 알림
 *     responses:
 *       200:
 *         description: 설정 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/notifications/settings',
  clerkAuthMiddleware,
  userController.updateNotificationSettings
);

/**
 * @swagger
 * /users/likes/send:
 *   post:
 *     summary: 좋아요 보내기
 *     tags: [Users, Likes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toUserId
 *               - groupId
 *             properties:
 *               toUserId:
 *                 type: string
 *                 format: uuid
 *                 description: 좋아요를 받을 사용자 ID
 *               groupId:
 *                 type: string
 *                 format: uuid
 *                 description: 그룹 ID
 *     responses:
 *       200:
 *         description: 좋아요 전송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     likeId:
 *                       type: string
 *                     isMatch:
 *                       type: boolean
 *                       description: 상호 좋아요로 매치가 생성되었는지 여부
 *                     matchId:
 *                       type: string
 *                       description: 매치가 생성된 경우 매치 ID
 *                     remainingCredits:
 *                       type: integer
 *                       description: 남은 크레딧 수
 *       400:
 *         description: 잘못된 요청 (크레딧 부족, 쿨다운 기간 등)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/likes/send',
  clerkAuthMiddleware,
  likeSendingLimiter,
  userController.sendLike
);

/**
 * @swagger
 * /users/likes/received:
 *   get:
 *     summary: 받은 좋아요 목록 조회
 *     tags: [Users, Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 받은 좋아요 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       user:
 *                         type: object
 *                         description: 좋아요를 보낸 사용자 정보 (프리미엄 사용자만 볼 수 있음)
 *                       group:
 *                         type: object
 *                       isMatch:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/likes/received',
  clerkAuthMiddleware,
  userController.getReceivedLikes
);

/**
 * @swagger
 * /users/likes/sent:
 *   get:
 *     summary: 보낸 좋아요 목록 조회
 *     tags: [Users, Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 보낸 좋아요 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       user:
 *                         type: object
 *                         description: 좋아요를 받은 사용자 정보
 *                       group:
 *                         type: object
 *                       isMatch:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/likes/sent',
  clerkAuthMiddleware,
  userController.getSentLikes
);

/**
 * @swagger
 * /users/credits:
 *   get:
 *     summary: 크레딧 정보 조회
 *     tags: [Users, Credits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 크레딧 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     credits:
 *                       type: integer
 *                       description: 현재 보유 크레딧
 *                     isPremium:
 *                       type: boolean
 *                       description: 프리미엄 회원 여부
 *                     premiumUntil:
 *                       type: string
 *                       format: date-time
 *                       description: 프리미엄 만료일
 *                     dailyLikesRemaining:
 *                       type: integer
 *                       description: 오늘 남은 무료 좋아요 수 (무료 회원만)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/credits',
  clerkAuthMiddleware,
  userController.getCredits
);

/**
 * @swagger
 * /users/account:
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
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 탈퇴 사유
 *     responses:
 *       200:
 *         description: 계정 비활성화 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/account',
  clerkAuthMiddleware,
  userController.deleteAccount
);

/**
 * @swagger
 * /users/likes/{likeId}/cancel:
 *   post:
 *     summary: 좋아요 취소
 *     tags: [Users, Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: likeId
 *         required: true
 *         schema:
 *           type: string
 *         description: 취소할 좋아요 ID
 *     responses:
 *       200:
 *         description: 좋아요 취소 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: 24시간이 지난 좋아요는 취소 불가
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/likes/:likeId/cancel',
  clerkAuthMiddleware,
  userController.cancelLike
);

/**
 * @swagger
 * /users/likes/history:
 *   delete:
 *     summary: 좋아요 이력 삭제
 *     tags: [Users, Likes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               likeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 삭제할 좋아요 ID 목록
 *     responses:
 *       200:
 *         description: 이력 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/likes/history',
  clerkAuthMiddleware,
  userController.deleteLikeHistory
);

// Privacy & Notification Settings
router.put('/privacy-settings', clerkAuthMiddleware, userController.updatePrivacySettings);
router.put('/notification-settings', clerkAuthMiddleware, userController.updateNotificationSettings);

export default router;