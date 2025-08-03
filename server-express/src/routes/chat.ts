/**
 * @module chat
 * @description 실시간 채팅 API 라우트 모듈
 * 
 * 이 모듈은 매칭된 사용자들 간의 채팅 기능을 제공하는 API 엔드포인트들을 관리합니다.
 * 모든 엔드포인트는 사용자 인증이 필요하며, 다음과 같은 기능을 포함합니다:
 * - 채팅 메시지 조회
 * - 메시지 전송
 * - 메시지 읽음 처리
 * - 타이핑 상태 관리
 * 
 * 실시간 기능은 WebSocket(Socket.IO)으로 처리되며, 이 라우트는 REST API 보완 기능을 제공합니다.
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import express from 'express';
import { ChatController } from '../controllers/ChatController';
import { authMiddleware } from '../middleware/auth';

/**
 * 채팅 API 라우터
 * @description 채팅 관련 REST API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
const router = express.Router();

/**
 * 채팅 컨트롤러 인스턴스
 * @description 채팅 비즈니스 로직을 처리하는 컨트롤러
 * @type {ChatController}
 */
const chatController = new ChatController();

// All chat routes require authentication
router.use(authMiddleware);

// Message operations
router.get('/:matchId/messages', chatController.getMessages);
router.post('/:matchId/messages', chatController.sendMessage);
router.put('/messages/:messageId/read', chatController.markAsRead);

// Typing indicators (handled via WebSocket, but REST endpoint for status)
router.post('/:matchId/typing', chatController.setTypingStatus);

export default router;