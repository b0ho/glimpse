import request from 'supertest';
import express from 'express';
import { matchController } from '../controllers/MatchController';
import { userController } from '../controllers/UserController';
import { prisma } from '../config/database';
import { createMockUser, createMockGroup, createMockMatch } from './setup';
import { errorHandler } from '../middleware/errorHandler';
import { likeService } from '../services/LikeService';

// Mock services
jest.mock('../services/LikeService');

// Mock auth middleware
const mockAuth = (req: any, res: any, next: any) => {
  req.auth = { userId: 'test-user-id' };
  next();
};

const app = express();
app.use(express.json());

// Mount match and user routes with mocked auth
app.post('/matches/like', mockAuth, userController.sendLike);
app.get('/matches', mockAuth, matchController.getMatches);
app.get('/matches/:matchId', mockAuth, matchController.getMatchById);
app.delete('/matches/:matchId', mockAuth, matchController.deleteMatch);
app.get('/matches/likes/received', mockAuth, userController.getReceivedLikes);
app.get('/matches/likes/sent', mockAuth, userController.getSentLikes);

// Add error handler
app.use(errorHandler);

describe('Match API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /matches/like', () => {
    const likeData = {
      toUserId: 'target-user-id',
      groupId: 'test-group-id',
    };

    it('should send like successfully', async () => {
      (likeService.sendLike as jest.Mock).mockResolvedValue({
        likeId: 'like-id',
        isMatch: false,
        message: '좋아요를 보냈습니다!'
      });

      const response = await request(app)
        .post('/matches/like')
        .send(likeData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          likeId: 'like-id',
          isMatch: false,
          message: '좋아요를 보냈습니다!'
        }
      });
    });

    it('should create match when mutual like', async () => {
      (likeService.sendLike as jest.Mock).mockResolvedValue({
        likeId: 'like-id',
        isMatch: true,
        matchId: 'match-id',
        message: '축하합니다! 새로운 매치가 생성되었습니다.'
      });

      const response = await request(app)
        .post('/matches/like')
        .send(likeData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          likeId: 'like-id',
          isMatch: true,
          matchId: 'match-id',
          message: '축하합니다! 새로운 매치가 생성되었습니다.'
        }
      });
    });

    it('should reject when not enough credits', async () => {
      (likeService.sendLike as jest.Mock).mockRejectedValue(
        createError(400, '좋아요 크레딧이 부족합니다.')
      );

      const response = await request(app)
        .post('/matches/like')
        .send(likeData)
        .expect(400);

      expect(response.body.error.message).toBe('좋아요 크레딧이 부족합니다.');
    });

    it('should reject when users not in same group', async () => {
      (likeService.sendLike as jest.Mock).mockRejectedValue(
        createError(400, '같은 그룹에 속한 사용자에게만 좋아요할 수 있습니다.')
      );

      const response = await request(app)
        .post('/matches/like')
        .send(likeData)
        .expect(400);

      expect(response.body.error.message).toBe('같은 그룹에 속한 사용자에게만 좋아요할 수 있습니다.');
    });

    it('should respect cooldown period', async () => {
      (likeService.sendLike as jest.Mock).mockRejectedValue(
        createError(400, '같은 사용자에게는 2주 후에 다시 좋아요할 수 있습니다.')
      );

      const response = await request(app)
        .post('/matches/like')
        .send(likeData)
        .expect(400);

      expect(response.body.error.message).toBe('같은 사용자에게는 2주 후에 다시 좋아요할 수 있습니다.');
    });
  });

  describe('GET /matches', () => {
    it('should return user matches', async () => {
      const mockMatches = {
        matches: [
          {
            id: 'match-1',
            user1: createMockUser({ nickname: 'User1' }),
            user2: createMockUser({ nickname: 'User2' }),
            group: createMockGroup({ name: 'Group1' }),
            _count: { messages: 5 },
          },
          {
            id: 'match-2',
            user1: createMockUser({ nickname: 'User3' }),
            user2: createMockUser({ nickname: 'User4' }),
            group: createMockGroup({ name: 'Group2' }),
            _count: { messages: 10 },
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        }
      };
      
      jest.spyOn(require('../services/MatchingService').matchingService, 'getUserMatches')
        .mockResolvedValue(mockMatches);

      const response = await request(app)
        .get('/matches')
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.matches).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter active matches', async () => {
      const mockMatches = {
        matches: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      };

      const getUserMatchesSpy = jest.spyOn(
        require('../services/MatchingService').matchingService, 
        'getUserMatches'
      ).mockResolvedValue(mockMatches);

      await request(app)
        .get('/matches')
        .query({ status: 'ACTIVE' })
        .expect(200);

      expect(getUserMatchesSpy).toHaveBeenCalledWith(
        'test-user-id',
        'ACTIVE',
        1,
        20
      );
    });
  });

  describe('GET /matches/:matchId', () => {
    it('should return match details', async () => {
      const mockMatch = {
        id: 'match-1',
        user1: createMockUser({ nickname: 'User1' }),
        user2: createMockUser({ id: 'test-user-id', nickname: 'User2' }),
        group: createMockGroup(),
        otherUser: createMockUser({ nickname: 'User1' }),
        canMessage: true,
      };
      
      jest.spyOn(require('../services/MatchingService').matchingService, 'getMatchById')
        .mockResolvedValue(mockMatch);

      const response = await request(app)
        .get(`/matches/${mockMatch.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(mockMatch.id);
      expect(response.body.data.canMessage).toBe(true);
      expect(response.body.data.otherUser.nickname).toBe('User1');
    });

    it('should return 404 for non-existent match', async () => {
      jest.spyOn(require('../services/MatchingService').matchingService, 'getMatchById')
        .mockResolvedValue(null);

      const response = await request(app)
        .get('/matches/non-existent')
        .expect(404);

      expect(response.body.error.message).toBe('매치를 찾을 수 없습니다.');
    });
  });

  describe('DELETE /matches/:matchId', () => {
    it('should delete match successfully', async () => {
      jest.spyOn(require('../services/MatchingService').matchingService, 'deleteMatch')
        .mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/matches/match-id')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          message: '매치가 삭제되었습니다.'
        }
      });
    });
  });

  describe('GET /matches/likes/received', () => {
    it('should return received likes for premium users', async () => {
      const mockUser = createMockUser({ isPremium: true });
      const mockLikes = [
        {
          id: 'like-1',
          fromUser: createMockUser({ nickname: 'SecretAdmirer1' }),
          group: createMockGroup(),
          createdAt: new Date(),
        },
        {
          id: 'like-2',
          fromUser: createMockUser({ nickname: 'SecretAdmirer2' }),
          group: createMockGroup(),
          createdAt: new Date(),
        },
      ];
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userLike.findMany as jest.Mock).mockResolvedValue(mockLikes);

      const response = await request(app)
        .get('/matches/likes/received')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'like-1',
            user: expect.objectContaining({
              nickname: 'SecretAdmirer1',
            }),
          }),
        ])
      });
    });

    it('should show anonymous likes for non-premium users', async () => {
      const mockUser = createMockUser({ isPremium: false });
      const mockLikes = [
        {
          id: 'like-1',
          fromUser: createMockUser(),
          group: createMockGroup(),
          createdAt: new Date(),
        },
      ];
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userLike.findMany as jest.Mock).mockResolvedValue(mockLikes);

      const response = await request(app)
        .get('/matches/likes/received')
        .expect(200);

      // For non-premium users, fromUser info should be hidden
      expect(response.body.data).toBeDefined();
      expect(response.body.data[0]).toBeDefined();
      expect(response.body.data[0].id).toBe('like-1');
    });
  });

  describe('GET /matches/likes/sent', () => {
    it('should return sent likes', async () => {
      const mockLikes = [
        {
          id: 'like-1',
          toUser: createMockUser({ nickname: 'TargetUser1' }),
          group: createMockGroup(),
          isMatch: false,
          createdAt: new Date(),
        },
        {
          id: 'like-2',
          toUser: createMockUser({ nickname: 'TargetUser2' }),
          group: createMockGroup(),
          isMatch: false,
          createdAt: new Date(),
        },
      ];
      
      (prisma.userLike.findMany as jest.Mock).mockResolvedValue(mockLikes);

      const response = await request(app)
        .get('/matches/likes/sent')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'like-1',
            user: expect.objectContaining({
              nickname: 'TargetUser1',
            }),
            isMatch: false,
          }),
        ])
      });
    });
  });
});

// Helper function to create error object
function createError(statusCode: number, message: string) {
  const error = new Error(message) as any;
  error.statusCode = statusCode;
  error.message = message;
  error.isOperational = true;
  return error;
}