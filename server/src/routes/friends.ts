/**
 * @module friends
 * @description 친구 관리 API 라우트 모듈
 * 
 * 이 모듈은 사용자들 간의 친구 관계를 관리하는 API 엔드포인트들을 제공합니다.
 * 매칭 전에 사용자들이 친구 관계를 형성할 수 있도록 지원하며, 다음과 같은 기능을 포함합니다:
 * - 친구 요청 보내기/또는 승인/거절
 * - 친구 목록 조회
 * - 친구 관계 해제
 * - 대기 중인 친구 요청 관리
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import { Router } from 'express';
import { clerkAuthMiddleware } from '../middleware/clerkAuth';
import { friendController } from '../controllers/FriendController';

/**
 * 친구 관리 API 라우터
 * @description 친구 관리 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
const router = Router();

// Get friend requests
router.get('/requests', clerkAuthMiddleware, friendController.getFriendRequests);

// Send friend request
router.post('/requests', clerkAuthMiddleware, friendController.sendFriendRequest);

// Accept friend request
router.post('/requests/:requestId/accept', clerkAuthMiddleware, friendController.acceptFriendRequest);

// Reject friend request
router.post('/requests/:requestId/reject', clerkAuthMiddleware, friendController.rejectFriendRequest);

// Get friends list
router.get('/', clerkAuthMiddleware, friendController.getFriends);

// Remove friend
router.delete('/:friendId', clerkAuthMiddleware, friendController.removeFriend);

export default router;