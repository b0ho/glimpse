import request from 'supertest';
import express from 'express';
import { chatController } from '../controllers/ChatController';
import { chatService } from '../services/ChatService';
import { encryptionService } from '../services/EncryptionService';
import { prisma } from '../config/database';
import { createMockUser, createMockMatch, createMockMessage } from './setup';

// Mock services
jest.mock('../services/ChatService');
jest.mock('../services/EncryptionService');

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
app.post('/chat/:matchId/typing', mockAuth, chatController.sendTypingIndicator);
app.get('/chat/unread-count', mockAuth, chatController.getUnreadCount);

describe('Chat API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /chat/:matchId/messages', () => {
    it('should return decrypted messages', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      const mockMessages = [
        createMockMessage({
          senderId: 'test-user-id',
          content: 'encrypted-content-1',
        }),
        createMockMessage({
          id: 'msg-2',
          senderId: 'other-user-id',
          content: 'encrypted-content-2',
        }),
      ];
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (chatService.getMessages as jest.Mock).mockResolvedValue({
        messages: mockMessages,
        total: 2,
      });
      
      (encryptionService.decrypt as jest.Mock)
        .mockResolvedValueOnce('Hello from me')
        .mockResolvedValueOnce('Hello from other');

      const response = await request(app)
        .get(`/chat/${mockMatch.id}/messages`)
        .query({ page: 1, limit: 50 })
        .expect(200);

      expect(response.body).toEqual({
        messages: expect.arrayContaining([
          expect.objectContaining({
            id: mockMessages[0].id,
            content: 'Hello from me',
            isMine: true,
          }),
          expect.objectContaining({
            id: mockMessages[1].id,
            content: 'Hello from other',
            isMine: false,
          }),
        ]),
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
        },
      });
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

      expect(response.body.error).toBe('이 채팅에 접근할 권한이 없습니다');
    });

    it('should handle decryption errors gracefully', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      const mockMessage = createMockMessage({
        content: 'corrupted-content',
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (chatService.getMessages as jest.Mock).mockResolvedValue({
        messages: [mockMessage],
        total: 1,
      });
      
      (encryptionService.decrypt as jest.Mock).mockRejectedValue(
        new Error('Decryption failed')
      );

      const response = await request(app)
        .get(`/chat/${mockMatch.id}/messages`)
        .expect(200);

      expect(response.body.messages[0].content).toBe('[메시지를 복호화할 수 없습니다]');
    });
  });

  describe('POST /chat/:matchId/messages', () => {
    const messageData = {
      content: 'Hello, how are you?',
      type: 'TEXT',
    };

    it('should send encrypted message successfully', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
        isActive: true,
      });
      
      const mockMessage = createMockMessage({
        senderId: 'test-user-id',
        content: 'encrypted-content',
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (encryptionService.encrypt as jest.Mock).mockResolvedValue('encrypted-content');
      (chatService.sendMessage as jest.Mock).mockResolvedValue(mockMessage);
      (encryptionService.decrypt as jest.Mock).mockResolvedValue(messageData.content);

      const response = await request(app)
        .post(`/chat/${mockMatch.id}/messages`)
        .send(messageData)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: mockMessage.id,
          content: messageData.content,
          type: 'TEXT',
          isMine: true,
        })
      );
      
      expect(encryptionService.encrypt).toHaveBeenCalledWith(messageData.content);
    });

    it('should validate message content', async () => {
      const response = await request(app)
        .post('/chat/match-id/messages')
        .send({ content: '', type: 'TEXT' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should prevent messaging in inactive match', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
        isActive: false,
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      const response = await request(app)
        .post(`/chat/${mockMatch.id}/messages`)
        .send(messageData)
        .expect(403);

      expect(response.body.error).toBe('매칭이 해제되어 메시지를 보낼 수 없습니다');
    });

    it('should handle image messages', async () => {
      const imageMessageData = {
        content: 'https://example.com/image.jpg',
        type: 'IMAGE',
        metadata: {
          width: 1024,
          height: 768,
          size: 204800,
        },
      };

      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
        isActive: true,
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (encryptionService.encrypt as jest.Mock).mockResolvedValue('encrypted-url');
      (chatService.sendMessage as jest.Mock).mockResolvedValue(
        createMockMessage({
          type: 'IMAGE',
          content: 'encrypted-url',
          metadata: imageMessageData.metadata,
        })
      );
      (encryptionService.decrypt as jest.Mock).mockResolvedValue(imageMessageData.content);

      const response = await request(app)
        .post(`/chat/${mockMatch.id}/messages`)
        .send(imageMessageData)
        .expect(201);

      expect(response.body.type).toBe('IMAGE');
      expect(response.body.metadata).toEqual(imageMessageData.metadata);
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
      
      (prisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (chatService.markAsRead as jest.Mock).mockResolvedValue({
        ...mockMessage,
        readAt: new Date(),
      });

      const response = await request(app)
        .put(`/chat/messages/${mockMessage.id}/read`)
        .expect(200);

      expect(response.body).toEqual({
        message: '메시지를 읽음으로 표시했습니다',
        readAt: expect.any(String),
      });
    });

    it('should not mark own message as read', async () => {
      const mockMessage = createMockMessage({
        senderId: 'test-user-id', // Own message
        matchId: 'match-id',
      });
      
      (prisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      const response = await request(app)
        .put(`/chat/messages/${mockMessage.id}/read`)
        .expect(400);

      expect(response.body.error).toBe('자신의 메시지는 읽음 표시할 수 없습니다');
    });

    it('should handle already read messages', async () => {
      const mockMessage = createMockMessage({
        senderId: 'other-user-id',
        readAt: new Date(),
      });
      
      (prisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      const response = await request(app)
        .put(`/chat/messages/${mockMessage.id}/read`)
        .expect(200);

      expect(response.body.message).toBe('이미 읽은 메시지입니다');
    });
  });

  describe('DELETE /chat/messages/:messageId', () => {
    it('should delete own message', async () => {
      const mockMessage = createMockMessage({
        senderId: 'test-user-id',
        matchId: 'match-id',
      });
      
      const mockMatch = createMockMatch({
        id: 'match-id',
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (chatService.deleteMessage as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete(`/chat/messages/${mockMessage.id}`)
        .expect(200);

      expect(response.body).toEqual({
        message: '메시지가 삭제되었습니다',
      });
    });

    it('should not delete other user message', async () => {
      const mockMessage = createMockMessage({
        senderId: 'other-user-id',
        matchId: 'match-id',
      });
      
      (prisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      const response = await request(app)
        .delete(`/chat/messages/${mockMessage.id}`)
        .expect(403);

      expect(response.body.error).toBe('다른 사용자의 메시지는 삭제할 수 없습니다');
    });

    it('should not delete old messages', async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago
      
      const mockMessage = createMockMessage({
        senderId: 'test-user-id',
        createdAt: oldDate,
      });
      
      (prisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      const response = await request(app)
        .delete(`/chat/messages/${mockMessage.id}`)
        .expect(400);

      expect(response.body.error).toBe('24시간이 지난 메시지는 삭제할 수 없습니다');
    });
  });

  describe('POST /chat/:matchId/typing', () => {
    it('should send typing indicator', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (chatService.sendTypingIndicator as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post(`/chat/${mockMatch.id}/typing`)
        .send({ isTyping: true })
        .expect(200);

      expect(response.body).toEqual({
        message: '타이핑 상태가 전송되었습니다',
      });
      
      expect(chatService.sendTypingIndicator).toHaveBeenCalledWith(
        mockMatch.id,
        'test-user-id',
        true
      );
    });

    it('should validate typing status', async () => {
      const response = await request(app)
        .post('/chat/match-id/typing')
        .send({}) // Missing isTyping
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /chat/unread-count', () => {
    it('should return unread message count', async () => {
      const unreadCounts = [
        { matchId: 'match-1', count: 5 },
        { matchId: 'match-2', count: 3 },
      ];
      
      (chatService.getUnreadCount as jest.Mock).mockResolvedValue({
        total: 8,
        byMatch: unreadCounts,
      });

      const response = await request(app)
        .get('/chat/unread-count')
        .expect(200);

      expect(response.body).toEqual({
        total: 8,
        byMatch: unreadCounts,
      });
    });

    it('should return zero when no unread messages', async () => {
      (chatService.getUnreadCount as jest.Mock).mockResolvedValue({
        total: 0,
        byMatch: [],
      });

      const response = await request(app)
        .get('/chat/unread-count')
        .expect(200);

      expect(response.body).toEqual({
        total: 0,
        byMatch: [],
      });
    });
  });
});