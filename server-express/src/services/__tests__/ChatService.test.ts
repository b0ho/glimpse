import { ChatService } from '../ChatService';
import { prismaMock } from '../../__tests__/setup';
import { createMockMatch, createMockMessage, createMockUser, createMockGroup } from '../../__tests__/setup';
import { notificationService } from '../NotificationService';

// Mock dependencies
jest.mock('../NotificationService');
jest.mock('../EncryptionService', () => ({
  encryptionService: {
    encrypt: jest.fn((content) => `encrypted_${content}`),
    decrypt: jest.fn((content) => content.replace('encrypted_', '')),
  },
}));
jest.mock('../ContentFilterService', () => ({
  contentFilterService: {
    filterText: jest.fn(() => ({ severity: 'ok', filteredText: null })),
  },
}));

describe('ChatService', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send encrypted text message', async () => {
      const matchId = 'match-1';
      const senderId = 'user-1';
      const content = 'Hello, world!';
      
      const mockMatch = createMockMatch({
        id: matchId,
        user1Id: senderId,
        user2Id: 'user-2',
        status: 'ACTIVE',
      });

      const mockMessage = createMockMessage({
        matchId,
        senderId,
        content: `encrypted_${content}`,
        isEncrypted: true,
      });

      prismaMock.chatMessage.create.mockResolvedValue({
        ...mockMessage,
        sender: {
          id: senderId,
          nickname: 'TestUser',
          profileImage: null
        }
      } as any);

      const result = await chatService.sendMessage(matchId, senderId, content);

      expect(result.content).toBe(content); // Decrypted content
      expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({
        data: {
          matchId,
          senderId,
          content: `encrypted_${content}`,
          type: 'TEXT',
          isEncrypted: true,
        },
        include: {
          sender: {
            select: {
              id: true,
              nickname: true,
              profileImage: true
            }
          }
        }
      });
    });

    it('should throw error for too long content', async () => {
      const longContent = 'a'.repeat(1001); // MAX_MESSAGE_LENGTH is 1000

      await expect(
        chatService.sendMessage('match-1', 'user-1', longContent)
      ).rejects.toThrow('1000자 이하여야 합니다');
    });

    it('should handle blocked content', async () => {
      const contentFilterService = require('../ContentFilterService').contentFilterService;
      contentFilterService.filterText.mockResolvedValueOnce({
        severity: 'blocked',
        filteredText: null
      });

      await expect(
        chatService.sendMessage('match-1', 'user-1', 'Bad content')
      ).rejects.toThrow('부적절한 내용이 포함되어 있습니다.');
    });

    it('should use filtered content when warnings exist', async () => {
      const contentFilterService = require('../ContentFilterService').contentFilterService;
      contentFilterService.filterText.mockResolvedValueOnce({
        severity: 'warning',
        filteredText: 'Filtered content'
      });

      const mockMessage = createMockMessage({
        content: 'encrypted_Filtered content',
        isEncrypted: true,
      });

      prismaMock.chatMessage.create.mockResolvedValue({
        ...mockMessage,
        sender: { id: 'user-1', nickname: 'User', profileImage: null }
      } as any);

      const result = await chatService.sendMessage('match-1', 'user-1', 'Original content');

      expect(result.content).toBe('Original content');
      expect(prismaMock.chatMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'encrypted_Filtered content'
          })
        })
      );
    });
  });

  describe('getMessages', () => {
    it('should return decrypted messages', async () => {
      const matchId = 'match-1';

      const mockMessages = [
        {
          ...createMockMessage({
            content: 'encrypted_Hello',
            isEncrypted: true,
            senderId: 'user-1',
          }),
          reactions: []
        },
        {
          ...createMockMessage({
            content: 'encrypted_Hi there',
            isEncrypted: true,
            senderId: 'user-2',
          }),
          reactions: []
        },
      ];

      prismaMock.chatMessage.findMany.mockResolvedValue(mockMessages as any);

      const result = await chatService.getMessages(matchId, 1, 20);

      expect(result).toHaveLength(2);
      expect(result[0]?.content).toBe('Hi there'); // Reversed order (oldest first)
      expect(result[1]?.content).toBe('Hello');
    });

    it('should handle pagination', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([]);

      await chatService.getMessages('match-1', 2, 20);

      expect(prismaMock.chatMessage.findMany).toHaveBeenCalledWith({
        where: { matchId: 'match-1' },
        include: expect.objectContaining({
          sender: expect.any(Object),
          reactions: expect.any(Object)
        }),
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 20,
      });
    });
  });

  describe('markAllMessagesAsRead', () => {
    it('should mark all unread messages in match as read', async () => {
      const matchId = 'match-1';
      const userId = 'user-2';
      
      const mockMatch = createMockMatch({
        id: matchId,
        user1Id: userId,
        user2Id: 'user-1',
      });

      prismaMock.match.findUnique.mockResolvedValue(mockMatch as any);
      prismaMock.chatMessage.updateMany.mockResolvedValue({ count: 5 });

      const result = await chatService.markAllMessagesAsRead(matchId, userId);

      expect(result.markedAsRead).toBe(5);
      expect(result.message).toBe('5개의 메시지를 읽음으로 표시했습니다.');
      expect(prismaMock.chatMessage.updateMany).toHaveBeenCalledWith({
        where: {
          matchId,
          senderId: 'user-1',
          readAt: null,
        },
        data: { readAt: expect.any(Date) },
      });
    });

    it('should throw error if match not found', async () => {
      prismaMock.match.findUnique.mockResolvedValue(null);

      await expect(
        chatService.markAllMessagesAsRead('non-existent', 'user-1')
      ).rejects.toThrow('매치를 찾을 수 없습니다.');
    });

    it('should throw error for unauthorized access', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'other-user-1',
        user2Id: 'other-user-2',
      });

      prismaMock.match.findUnique.mockResolvedValue(mockMatch as any);

      await expect(
        chatService.markAllMessagesAsRead('match-1', 'unauthorized-user')
      ).rejects.toThrow('이 채팅에 접근할 권한이 없습니다.');
    });
  });

  describe('typing status', () => {
    it('should set typing status', async () => {
      const matchId = 'match-1';
      const userId = 'user-1';

      const result = await chatService.setTypingStatus(matchId, userId, true);

      expect(result).toEqual({
        matchId,
        userId,
        isTyping: true
      });
    });

    it('should get typing users', async () => {
      const matchId = 'match-1';
      
      const result = await chatService.getTypingUsers(matchId);

      expect(result).toEqual([]);
    });
  });

  describe('getChatSummary', () => {
    it('should return chat summaries for user', async () => {
      const userId = 'user-1';
      const mockMatches = [
        {
          id: 'match-1',
          user1Id: userId,
          user2Id: 'user-2',
          status: 'ACTIVE',
          createdAt: new Date(),
          user1: createMockUser({ id: userId }),
          user2: createMockUser({ id: 'user-2', nickname: 'User2' }),
          group: createMockGroup({ name: 'Test Group' }),
          messages: [{
            content: 'encrypted_Last message',
            senderId: 'user-2',
            isEncrypted: true,
            createdAt: new Date(),
            sender: { id: 'user-2' }
          }],
        },
      ];

      prismaMock.match.findMany.mockResolvedValue(mockMatches as any);
      prismaMock.chatMessage.count.mockResolvedValue(3);

      const result = await chatService.getChatSummary(userId, 1, 10);

      expect(result).toHaveLength(1);
      expect(result[0]?.user.nickname).toBe('User2');
      expect(result[0]?.lastMessage?.content).toBe('Last message');
      expect(result[0]?.unreadCount).toBe(3);
    });
  });

  describe('getMessageStats', () => {
    it('should return message statistics', async () => {
      const matchId = 'match-1';
      const mockMatch = createMockMatch({
        id: matchId,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      });

      prismaMock.chatMessage.count.mockResolvedValue(70);
      prismaMock.chatMessage.groupBy.mockResolvedValue([
        { senderId: 'user-1', _count: 40 },
        { senderId: 'user-2', _count: 30 },
      ] as any);
      prismaMock.match.findUnique.mockResolvedValue(mockMatch as any);

      const result = await chatService.getMessageStats(matchId);

      expect(result.totalMessages).toBe(70);
      expect(result.averageMessagesPerDay).toBe(10);
      expect(result.userStats).toHaveLength(2);
      expect(result.userStats[0]?.percentage).toBe(57.14285714285714);
    });
  });
});