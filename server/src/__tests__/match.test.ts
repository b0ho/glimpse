import request from 'supertest';
import express from 'express';
import { matchController } from '../controllers/MatchController';
import { matchingService } from '../services/MatchingService';
import { likeService } from '../services/LikeService';
import { prisma } from '../config/database';
import { createMockUser, createMockGroup, createMockMatch } from './setup';

// Mock services
jest.mock('../services/MatchingService');
jest.mock('../services/LikeService');

// Mock auth middleware
const mockAuth = (req: any, res: any, next: any) => {
  req.auth = { userId: 'test-user-id' };
  next();
};

const app = express();
app.use(express.json());

// Mount match routes with mocked auth
app.post('/matches/like', mockAuth, matchController.sendLike);
app.get('/matches', mockAuth, matchController.getMatches);
app.get('/matches/:matchId', mockAuth, matchController.getMatchById);
app.delete('/matches/:matchId', mockAuth, matchController.unmatch);
app.get('/matches/likes/received', mockAuth, matchController.getReceivedLikes);
app.get('/matches/likes/sent', mockAuth, matchController.getSentLikes);

describe('Match API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /matches/like', () => {
    const likeData = {
      targetUserId: 'target-user-id',
      groupId: 'test-group-id',
    };

    it('should send like successfully', async () => {
      const mockUser = createMockUser({ credits: 5 });
      const mockTarget = createMockUser({ id: 'target-user-id' });
      const mockGroup = createMockGroup();
      
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // Current user
        .mockResolvedValueOnce(mockTarget); // Target user
      
      (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
      
      (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([
        { userId: mockUser.id, status: 'ACTIVE' },
        { userId: mockTarget.id, status: 'ACTIVE' },
      ]);
      
      (likeService.canSendLike as jest.Mock).mockResolvedValue({
        canSend: true,
        reason: null,
      });
      
      (likeService.sendLike as jest.Mock).mockResolvedValue({
        id: 'like-id',
        isMatch: false,
      });

      const response = await request(app)
        .post('/matches/like')
        .send(likeData)
        .expect(200);

      expect(response.body).toEqual({
        message: '좋아요를 보냈습니다',
        like: expect.objectContaining({
          id: 'like-id',
        }),
        isMatch: false,
        creditsRemaining: 4,
      });
    });

    it('should create match when mutual like', async () => {
      const mockUser = createMockUser({ credits: 5 });
      const mockTarget = createMockUser({ id: 'target-user-id' });
      const mockMatch = createMockMatch({
        user1Id: mockUser.id,
        user2Id: mockTarget.id,
      });
      
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockTarget);
      
      (prisma.group.findUnique as jest.Mock).mockResolvedValue(createMockGroup());
      
      (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([
        { userId: mockUser.id, status: 'ACTIVE' },
        { userId: mockTarget.id, status: 'ACTIVE' },
      ]);
      
      (likeService.canSendLike as jest.Mock).mockResolvedValue({
        canSend: true,
        reason: null,
      });
      
      (likeService.sendLike as jest.Mock).mockResolvedValue({
        id: 'like-id',
        isMatch: true,
      });
      
      (matchingService.createMatch as jest.Mock).mockResolvedValue(mockMatch);

      const response = await request(app)
        .post('/matches/like')
        .send(likeData)
        .expect(200);

      expect(response.body).toEqual({
        message: '매칭이 성사되었습니다! 🎉',
        like: expect.objectContaining({
          id: 'like-id',
        }),
        isMatch: true,
        match: expect.objectContaining({
          id: mockMatch.id,
        }),
        creditsRemaining: 4,
      });
    });

    it('should reject when not enough credits', async () => {
      const mockUser = createMockUser({ credits: 0, isPremium: false });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/matches/like')
        .send(likeData)
        .expect(402);

      expect(response.body.error).toBe('크레딧이 부족합니다');
    });

    it('should reject when users not in same group', async () => {
      const mockUser = createMockUser();
      const mockTarget = createMockUser({ id: 'target-user-id' });
      
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockTarget);
      
      (prisma.group.findUnique as jest.Mock).mockResolvedValue(createMockGroup());
      
      (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([
        { userId: mockUser.id, status: 'ACTIVE' },
        // Target user not in group
      ]);

      const response = await request(app)
        .post('/matches/like')
        .send(likeData)
        .expect(400);

      expect(response.body.error).toBe('같은 그룹의 멤버가 아닙니다');
    });

    it('should respect cooldown period', async () => {
      const mockUser = createMockUser();
      const mockTarget = createMockUser({ id: 'target-user-id' });
      
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockTarget);
      
      (prisma.group.findUnique as jest.Mock).mockResolvedValue(createMockGroup());
      
      (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([
        { userId: mockUser.id, status: 'ACTIVE' },
        { userId: mockTarget.id, status: 'ACTIVE' },
      ]);
      
      (likeService.canSendLike as jest.Mock).mockResolvedValue({
        canSend: false,
        reason: 'COOLDOWN',
        cooldownEnds: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      });

      const response = await request(app)
        .post('/matches/like')
        .send(likeData)
        .expect(429);

      expect(response.body.error).toContain('다시 좋아요를 보낼 수 있습니다');
    });
  });

  describe('GET /matches', () => {
    it('should return user matches', async () => {
      const mockMatches = [
        {
          ...createMockMatch(),
          user1: createMockUser({ nickname: 'User1' }),
          user2: createMockUser({ nickname: 'User2' }),
          group: createMockGroup({ name: 'Group1' }),
          _count: { messages: 5 },
        },
        {
          ...createMockMatch({ id: 'match-2' }),
          user1: createMockUser({ nickname: 'User3' }),
          user2: createMockUser({ nickname: 'User4' }),
          group: createMockGroup({ name: 'Group2' }),
          _count: { messages: 10 },
        },
      ];
      
      (matchingService.getUserMatches as jest.Mock).mockResolvedValue({
        matches: mockMatches,
        total: 2,
      });

      const response = await request(app)
        .get('/matches')
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body).toEqual({
        matches: expect.arrayContaining([
          expect.objectContaining({
            id: mockMatches[0].id,
            otherUser: expect.objectContaining({
              nickname: expect.any(String),
            }),
            group: expect.objectContaining({
              name: 'Group1',
            }),
            messageCount: 5,
          }),
        ]),
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should filter active matches', async () => {
      (matchingService.getUserMatches as jest.Mock).mockResolvedValue({
        matches: [],
        total: 0,
      });

      await request(app)
        .get('/matches')
        .query({ status: 'active' })
        .expect(200);

      expect(matchingService.getUserMatches).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({ status: 'active' })
      );
    });
  });

  describe('GET /matches/:matchId', () => {
    it('should return match details', async () => {
      const mockMatch = {
        ...createMockMatch(),
        user1: createMockUser({ nickname: 'User1' }),
        user2: createMockUser({ id: 'test-user-id', nickname: 'User2' }),
        group: createMockGroup(),
        messages: [],
      };
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      const response = await request(app)
        .get(`/matches/${mockMatch.id}`)
        .expect(200);

      expect(response.body).toEqual({
        ...expect.objectContaining({
          id: mockMatch.id,
        }),
        otherUser: expect.objectContaining({
          nickname: 'User1',
        }),
        canMessage: true,
      });
    });

    it('should return 404 for non-existent match', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/matches/non-existent')
        .expect(404);

      expect(response.body.error).toBe('매칭을 찾을 수 없습니다');
    });

    it('should restrict access to other users matches', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'other-user-1',
        user2Id: 'other-user-2',
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      const response = await request(app)
        .get(`/matches/${mockMatch.id}`)
        .expect(403);

      expect(response.body.error).toBe('접근 권한이 없습니다');
    });
  });

  describe('DELETE /matches/:matchId', () => {
    it('should unmatch successfully', async () => {
      const mockMatch = createMockMatch({
        user1Id: 'test-user-id',
        user2Id: 'other-user-id',
      });
      
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (matchingService.unmatch as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete(`/matches/${mockMatch.id}`)
        .send({ reason: '더 이상 관심 없음' })
        .expect(200);

      expect(response.body).toEqual({
        message: '매칭이 해제되었습니다',
      });
    });

    it('should require unmatch reason', async () => {
      const response = await request(app)
        .delete('/matches/match-id')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
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
      (likeService.getReceivedLikes as jest.Mock).mockResolvedValue({
        likes: mockLikes,
        total: 2,
      });

      const response = await request(app)
        .get('/matches/likes/received')
        .expect(200);

      expect(response.body).toEqual({
        likes: expect.arrayContaining([
          expect.objectContaining({
            id: 'like-1',
            fromUser: expect.objectContaining({
              nickname: 'SecretAdmirer1',
            }),
          }),
        ]),
        total: 2,
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
      (likeService.getReceivedLikes as jest.Mock).mockResolvedValue({
        likes: mockLikes,
        total: 1,
      });

      const response = await request(app)
        .get('/matches/likes/received')
        .expect(200);

      expect(response.body.likes[0].fromUser).toBeUndefined();
      expect(response.body.likes[0].group).toBeDefined();
      expect(response.body.total).toBe(1);
    });
  });

  describe('GET /matches/likes/sent', () => {
    it('should return sent likes', async () => {
      const mockLikes = [
        {
          id: 'like-1',
          toUser: createMockUser({ nickname: 'TargetUser1' }),
          group: createMockGroup(),
          status: 'PENDING',
          createdAt: new Date(),
        },
        {
          id: 'like-2',
          toUser: createMockUser({ nickname: 'TargetUser2' }),
          group: createMockGroup(),
          status: 'REJECTED',
          createdAt: new Date(),
        },
      ];
      
      (likeService.getSentLikes as jest.Mock).mockResolvedValue({
        likes: mockLikes,
        total: 2,
      });

      const response = await request(app)
        .get('/matches/likes/sent')
        .expect(200);

      expect(response.body).toEqual({
        likes: expect.arrayContaining([
          expect.objectContaining({
            id: 'like-1',
            toUser: expect.objectContaining({
              anonymousId: expect.any(String),
            }),
            status: 'PENDING',
          }),
        ]),
        total: 2,
      });
      
      // Should not reveal full user info
      expect(response.body.likes[0].toUser.nickname).toBeUndefined();
    });
  });
});