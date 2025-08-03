import request from 'supertest';
import express from 'express';
import { chatController } from '../controllers/ChatController';
import { prisma } from '../config/database';
import { createMockUser, createMockMatch, createMockMessage } from './setup';
import { errorHandler } from '../middleware/errorHandler';

// Mock auth middleware
const mockAuth = (req: any, res: any, next: any) => {
  req.auth = { userId: 'test-user-id' };
  next();
};

const app = express();
app.use(express.json());

// Mount chat routes with mocked auth
app.get('/chat/:matchId/messages', mockAuth, chatController.getMessages);
app.post('/chat/:matchId/messages', mockAuth, chatController.sendMessage);
app.put('/chat/messages/:messageId/read', mockAuth, chatController.markAsRead);
app.delete('/chat/messages/:messageId', mockAuth, chatController.deleteMessage);
app.post('/chat/:matchId/typing', mockAuth, chatController.setTypingStatus);
app.get('/chat/summary', mockAuth, chatController.getChatSummary);

// Add error handler
app.use(errorHandler);

describe('Chat API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /chat/:matchId/messages', () => {
    it('should return messages', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      
      // Mock ChatService's getMessages
      const chatService = require('../services/ChatService').chatService;
      jest.spyOn(chatService, 'getMessages').mockResolvedValue([
        {
          id: 'msg-1',
          content: 'Hello from me',
          type: 'TEXT',
          sender: { id: 'test-user-id', nickname: 'Test User' },
          readAt: null,
          createdAt: new Date()
        },
        {
          id: 'msg-2',
          content: 'Hello from other',
          type: 'TEXT',
          sender: { id: 'other-user-id', nickname: 'Other User' },
          readAt: null,
          createdAt: new Date()
        }
      ]);

      const response = await request(app)
        .get(`/chat/${mockMatch.id}/messages`)
        .query({ page: 1, limit: 50 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveLength(2);
    });

    it('should restrict access to non-participant', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'other-user-1',
        user2Id: 'other-user-2',
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      const response = await request(app)
        .get(`/chat/${mockMatch.id}/messages`)
        .expect(403);

      expect(response.body.error.message).toBe('이 채팅에 접근할 권한이 없습니다.');
    });
  });

  describe('POST /chat/:matchId/messages', () => {
    const messageData = {
      content: 'Hello, how are you?',
      type: 'TEXT',
    };

    it('should send message successfully', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
        status: 'ACTIVE',
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue({
        ...mockMatch,
        user1: { id: 'test-user-id', nickname: 'Test User' },
        user2: { id: 'other-user-id', nickname: 'Other User' }
      });
      
      // Mock ChatService's sendMessage
      const chatService = require('../services/ChatService').chatService;
      jest.spyOn(chatService, 'sendMessage').mockResolvedValue({
        id: 'new-message-id',
        content: messageData.content,
        type: 'TEXT',
        sender: { id: 'test-user-id', nickname: 'Test User' },
        createdAt: new Date()
      });
      
      // Mock socket.io
      const io = require('../index').io;
      io.to = jest.fn().mockReturnValue({ emit: jest.fn() });
      
      // Mock notification service
      const notificationService = require('../services/NotificationService').notificationService;
      jest.spyOn(notificationService, 'sendMessageNotification').mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/chat/${mockMatch.id}/messages`)
        .send(messageData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'new-message-id',
          content: messageData.content,
          type: 'TEXT',
        })
      });
      
      expect(chatService.sendMessage).toHaveBeenCalledWith(
        mockMatch.id,
        'test-user-id',
        messageData.content,
        messageData.type
      );
    });

    it('should validate message content', async () => {
      const response = await request(app)
        .post('/chat/match-id/messages')
        .send({ content: '', type: 'TEXT' })
        .expect(400);

      expect(response.body.error.message).toBeDefined();
    });

    it('should prevent messaging in inactive match', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
        status: 'UNMATCHED',
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue({
        ...mockMatch,
        user1: { id: 'test-user-id', nickname: 'Test User' },
        user2: { id: 'other-user-id', nickname: 'Other User' }
      });

      const response = await request(app)
        .post(`/chat/${mockMatch.id}/messages`)
        .send(messageData)
        .expect(400);

      expect(response.body.error.message).toBe('활성 상태의 매치에서만 메시지를 보낼 수 있습니다.');
    });
  });

  describe('PUT /chat/messages/:messageId/read', () => {
    it('should mark message as read', async () => {
      const mockMessage = createMockMessage({
        senderId: 'other-user-id',
        matchId: 'match-id',
        readAt: null,
      });
      
      const mockMatch = createMockMatch({
        id: 'match-id',
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.chatMessage.findUnique as jest.Mock).mockResolvedValue({
        ...mockMessage,
        match: mockMatch
      });
      
      const readAt = new Date();
      (prisma.chatMessage.update as jest.Mock).mockResolvedValue({
        ...mockMessage,
        readAt,
      });
      
      // Mock socket.io
      const io = require('../index').io;
      io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

      const response = await request(app)
        .put(`/chat/messages/${mockMessage.id}/read`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          message: '메시지를 읽음으로 표시했습니다.'
        }
      });
    });

    it('should not mark own message as read', async () => {
      const mockMessage = createMockMessage({
        senderId: 'test-user-id', // Own message
        matchId: 'match-id',
      });
      
      const mockMatch = createMockMatch({
        id: 'match-id',
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.chatMessage.findUnique as jest.Mock).mockResolvedValue({
        ...mockMessage,
        match: mockMatch
      });

      const response = await request(app)
        .put(`/chat/messages/${mockMessage.id}/read`)
        .expect(403);

      expect(response.body.error.message).toBe('이 메시지를 읽음으로 표시할 권한이 없습니다.');
    });

    it('should handle already read messages', async () => {
      const mockMessage = createMockMessage({
        senderId: 'other-user-id',
        readAt: new Date(),
      });
      
      const mockMatch = createMockMatch({
        id: 'match-id',
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.chatMessage.findUnique as jest.Mock).mockResolvedValue({
        ...mockMessage,
        match: mockMatch
      });

      const response = await request(app)
        .put(`/chat/messages/${mockMessage.id}/read`)
        .expect(400);

      expect(response.body.error.message).toBe('이미 읽음으로 표시된 메시지입니다.');
    });
  });

  describe('DELETE /chat/messages/:messageId', () => {
    it('should delete own message', async () => {
      const mockMessage = createMockMessage({
        senderId: 'test-user-id',
        matchId: 'match-id',
        createdAt: new Date(), // Recent message
      });
      
      const mockMatch = createMockMatch({
        id: 'match-id',
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.chatMessage.findUnique as jest.Mock).mockResolvedValue({
        ...mockMessage,
        match: mockMatch
      });
      
      (prisma.chatMessage.delete as jest.Mock).mockResolvedValue(mockMessage);
      
      // Mock socket.io
      const io = require('../index').io;
      io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

      const response = await request(app)
        .delete(`/chat/messages/${mockMessage.id}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          message: '메시지가 삭제되었습니다.'
        }
      });
    });

    it('should not delete other user message', async () => {
      const mockMessage = createMockMessage({
        senderId: 'other-user-id',
        matchId: 'match-id',
      });
      
      const mockMatch = createMockMatch({
        id: 'match-id',
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.chatMessage.findUnique as jest.Mock).mockResolvedValue({
        ...mockMessage,
        match: mockMatch
      });

      const response = await request(app)
        .delete(`/chat/messages/${mockMessage.id}`)
        .expect(403);

      expect(response.body.error.message).toBe('본인이 보낸 메시지만 삭제할 수 있습니다.');
    });

    it('should not delete old messages', async () => {
      const oldDate = new Date();
      oldDate.setMinutes(oldDate.getMinutes() - 6); // 6 minutes ago
      
      const mockMessage = createMockMessage({
        senderId: 'test-user-id',
        createdAt: oldDate,
      });
      
      const mockMatch = createMockMatch({
        id: 'match-id',
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.chatMessage.findUnique as jest.Mock).mockResolvedValue({
        ...mockMessage,
        match: mockMatch
      });

      const response = await request(app)
        .delete(`/chat/messages/${mockMessage.id}`)
        .expect(400);

      expect(response.body.error.message).toBe('메시지는 전송 후 5분 이내에만 삭제할 수 있습니다.');
    });
  });

  describe('POST /chat/:matchId/typing', () => {
    it('should send typing indicator', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      
      // Mock socket.io
      const io = require('../index').io;
      io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

      const response = await request(app)
        .post(`/chat/${mockMatch.id}/typing`)
        .send({ isTyping: true })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          message: '입력 상태가 전송되었습니다.'
        }
      });
    });

    it('should validate typing status', async () => {
      const response = await request(app)
        .post('/chat/match-id/typing')
        .send({}) // Missing isTyping
        .expect(400);

      expect(response.body.error.message).toBeDefined();
    });
  });

  describe('GET /chat/summary', () => {
    it('should return chat summary', async () => {
      const mockSummary = [
        {
          matchId: 'match-1',
          user: { id: 'other-1', nickname: 'User 1' },
          group: { id: 'group-1', name: 'Group 1' },
          lastMessage: { content: 'Hello', isFromMe: false, createdAt: new Date() },
          unreadCount: 5
        },
        {
          matchId: 'match-2',
          user: { id: 'other-2', nickname: 'User 2' },
          group: { id: 'group-2', name: 'Group 2' },
          lastMessage: { content: 'Hi there', isFromMe: true, createdAt: new Date() },
          unreadCount: 3
        }
      ];
      
      const chatService = require('../services/ChatService').chatService;
      jest.spyOn(chatService, 'getChatSummary').mockResolvedValue(mockSummary);

      const response = await request(app)
        .get('/chat/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveLength(2);
    });
  });
});