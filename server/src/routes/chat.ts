import express from 'express';
import { ChatController } from '../controllers/ChatController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
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