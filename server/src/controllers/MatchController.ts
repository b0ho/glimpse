import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { MatchingService } from '../services/MatchingService';
import { MatchingStatisticsService } from '../services/MatchingStatisticsService';

const prisma = new PrismaClient();
const matchingService = new MatchingService();
const matchingStatsService = new MatchingStatisticsService();

export class MatchController {
  async getMatches(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.user.id;
      const { status = 'ACTIVE', page = 1, limit = 20 } = req.query;

      const matches = await matchingService.getUserMatches(
        userId,
        status as any,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: matches
      });
    } catch (error) {
      next(error);
    }
  }

  async getMatchById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { matchId } = req.params;
      const userId = req.user.id;
      
      if (!matchId) {
        throw createError(400, '매치 ID가 필요합니다.');
      }

      const match = await matchingService.getMatchById(matchId, userId);

      if (!match) {
        throw createError(404, '매치를 찾을 수 없습니다.');
      }

      res.json({
        success: true,
        data: match
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { matchId } = req.params;
      const userId = req.user.id;
      
      if (!matchId) {
        throw createError(400, '매치 ID가 필요합니다.');
      }

      await matchingService.deleteMatch(matchId, userId);

      res.json({
        success: true,
        data: { message: '매치가 삭제되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMatchStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.user.id;

      const stats = await matchingStatsService.getUserMatchingStatistics(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.user.id;
      const { groupId, count = 10 } = req.query;

      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }

      const recommendations = await matchingService.getMatchingRecommendations(
        userId,
        groupId as string,
        parseInt(count as string)
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  }

  async reportMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { matchId } = req.params;
      const { reason, description } = req.body;
      const userId = req.user.id;
      
      if (!matchId) {
        throw createError(400, '매치 ID가 필요합니다.');
      }

      if (!reason) {
        throw createError(400, '신고 사유가 필요합니다.');
      }

      const result = await matchingService.reportMatch(matchId, userId, reason, description);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async extendMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { matchId } = req.params;
      const userId = req.user.id;
      
      if (!matchId) {
        throw createError(400, '매치 ID가 필요합니다.');
      }

      // Check if user is premium
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPremium: true }
      });

      if (!user?.isPremium) {
        throw createError(403, '프리미엄 멤버만 매치를 연장할 수 있습니다.');
      }

      const result = await matchingService.extendMatch(matchId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getMatchingHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.user.id;
      const { page = 1, limit = 20, groupId } = req.query;

      const history = await matchingService.getMatchingHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        groupId as string
      );

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  async getMutualConnections(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { matchId } = req.params;
      const userId = req.user.id;
      
      if (!matchId) {
        throw createError(400, '매치 ID가 필요합니다.');
      }

      const connections = await matchingService.getMutualConnections(matchId, userId);

      res.json({
        success: true,
        data: connections
      });
    } catch (error) {
      next(error);
    }
  }
}