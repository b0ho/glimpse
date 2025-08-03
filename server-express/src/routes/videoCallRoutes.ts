/**
 * @module videoCallRoutes
 * @description 영상통화 API 라우트 모듈
 * 
 * 이 모듈은 WebRTC 기술을 활용한 실시간 영상통화 기능을 제공하는 API 엔드포인트들을 관리합니다.
 * 매칭된 사용자들 간의 안전한 영상통화를 지원하며, 다음과 같은 기능을 포함합니다:
 * - 영상통화 시작/수락/거절/종료
 * - 통화 내역 관리
 * - 활성 통화 상태 조회
 * - WebRTC 시그널링 처리
 * - P2P 연결 관리
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import { Router } from 'express';
import { requireClerkAuth } from '../middleware/clerkAuth';
import { videoCallController } from '../controllers/VideoCallController';

/**
 * 영상통화 API 라우터
 * @description 영상통화 기능 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
const router = Router();

// All routes require authentication
router.use(requireClerkAuth);

// Initiate a call
router.post('/initiate', videoCallController.initiateCall);

// Accept a call
router.post('/:callId/accept', videoCallController.acceptCall);

// Reject a call
router.post('/:callId/reject', videoCallController.rejectCall);

// End a call
router.post('/:callId/end', videoCallController.endCall);

// Get call history
router.get('/history', videoCallController.getCallHistory);

// Get active call
router.get('/active', videoCallController.getActiveCall);

// WebRTC signaling
router.post('/signal', videoCallController.handleSignaling);

export default router;