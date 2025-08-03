import request from 'supertest';
import express from 'express';
import { MatchController } from '../MatchController';
import { MatchingService } from '../../services/MatchingService';
import { authMiddleware } from '../../middleware/auth';
import { createMockMatch, createMockUser, createMockGroup } from '../../__tests__/setup';

// Mock dependencies
jest.mock('../../services/MatchingService');
jest.mock('../../middleware/auth');

describe('MatchController', () => {
  let app: express.Application;
  let matchController: MatchController;
  let mockMatchingService: jest.Mocked<MatchingService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Setup mocks
    mockMatchingService = new MatchingService() as jest.Mocked<MatchingService>;
    matchController = new MatchController();

    // Mock auth middleware
    (authMiddleware as jest.Mock).mockImplementation((req, res, next) => {
      req.user = { id: 'test-user-id' };
      next();
    });

    // Setup routes
    app.get('/matches', authMiddleware, (req, res, next) =>
      matchController.getMatches(req, res, next)
    );
    app.get('/matches/:matchId', authMiddleware, (req, res, next) =>
      matchController.getMatchById(req, res, next)
    );
    app.delete('/matches/:matchId', authMiddleware, (req, res, next) =>
      matchController.deleteMatch(req, res, next)
    );
    app.get('/matches/recommendations/:groupId', authMiddleware, (req, res, next) =>
      matchController.getRecommendations(req, res, next)
    );
    app.post('/matches/:matchId/report', authMiddleware, (req, res, next) =>
      matchController.reportMatch(req, res, next)
    );
  });

  describe('GET /matches', () => {
    it('should return user matches', async () => {
      const mockMatches = [
        {
          id: 'match-1',
          user: createMockUser({ id: 'user-2', nickname: 'MatchedUser' }),
          group: createMockGroup({ name: 'Test Group' }),
          status: 'ACTIVE',
          lastMessage: {
            content: 'Hello',
            isFromMe: false,
            createdAt: new Date(),
          },
          createdAt: new Date(),
        },
      ];

      mockMatchingService.getUserMatches.mockResolvedValue(mockMatches as any);

      const response = await request(app)
        .get('/matches')
        .query({ status: 'ACTIVE', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].user.nickname).toBe('MatchedUser');
      expect(mockMatchingService.getUserMatches).toHaveBeenCalledWith(
        'test-user-id',
        'ACTIVE',
        1,
        10
      );
    });

    it('should handle invalid status', async () => {
      const response = await request(app)
        .get('/matches')
        .query({ status: 'INVALID' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should use default pagination', async () => {
      mockMatchingService.getUserMatches.mockResolvedValue([]);

      await request(app)
        .get('/matches')
        .expect(200);

      expect(mockMatchingService.getUserMatches).toHaveBeenCalledWith(
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
        user: createMockUser({ id: 'user-2' }),
        group: createMockGroup(),
        status: 'ACTIVE',
        createdAt: new Date(),
      };

      mockMatchingService.getMatchById.mockResolvedValue(mockMatch as any);

      const response = await request(app)
        .get('/matches/match-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('match-1');
      expect(mockMatchingService.getMatchById).toHaveBeenCalledWith(
        'match-1',
        'test-user-id'
      );
    });

    it('should handle match not found', async () => {
      mockMatchingService.getMatchById.mockResolvedValue(null);

      const response = await request(app)
        .get('/matches/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Match not found');
    });
  });

  describe('DELETE /matches/:matchId', () => {
    it('should delete match', async () => {
      mockMatchingService.deleteMatch.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/matches/match-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('매치가 삭제되었습니다.');
      expect(mockMatchingService.deleteMatch).toHaveBeenCalledWith(
        'match-1',
        'test-user-id'
      );
    });

    it('should handle deletion errors', async () => {
      mockMatchingService.deleteMatch.mockRejectedValue(
        new Error('매치를 찾을 수 없습니다.')
      );

      const response = await request(app)
        .delete('/matches/non-existent')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('매치를 찾을 수 없습니다.');
    });
  });

  describe('GET /matches/recommendations/:groupId', () => {
    it('should return recommendations', async () => {
      const mockRecommendations = [
        {
          id: 'user-2',
          nickname: 'U****',
          age: 25,
          gender: 'FEMALE',
          profileImage: 'https://example.com/image.jpg',
          bio: null,
          compatibilityScore: 85,
        },
      ];

      mockMatchingService.getMatchingRecommendations.mockResolvedValue(
        mockRecommendations as any
      );

      const response = await request(app)
        .get('/matches/recommendations/group-1')
        .query({ count: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].compatibilityScore).toBe(85);
      expect(mockMatchingService.getMatchingRecommendations).toHaveBeenCalledWith(
        'test-user-id',
        'group-1',
        5
      );
    });

    it('should use default count', async () => {
      mockMatchingService.getMatchingRecommendations.mockResolvedValue([]);

      await request(app)
        .get('/matches/recommendations/group-1')
        .expect(200);

      expect(mockMatchingService.getMatchingRecommendations).toHaveBeenCalledWith(
        'test-user-id',
        'group-1',
        10
      );
    });
  });

  describe('POST /matches/:matchId/report', () => {
    it('should report match', async () => {
      const reportData = {
        reason: 'INAPPROPRIATE_CONTENT',
        description: 'Offensive messages',
      };

      mockMatchingService.reportMatch.mockResolvedValue({
        message: '신고가 접수되었습니다.',
      });

      const response = await request(app)
        .post('/matches/match-1/report')
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('신고가 접수되었습니다.');
      expect(mockMatchingService.reportMatch).toHaveBeenCalledWith(
        'match-1',
        'test-user-id',
        'INAPPROPRIATE_CONTENT',
        'Offensive messages'
      );
    });

    it('should validate report reason', async () => {
      const response = await request(app)
        .post('/matches/match-1/report')
        .send({ reason: 'INVALID_REASON' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require reason', async () => {
      const response = await request(app)
        .post('/matches/match-1/report')
        .send({ description: 'No reason provided' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});