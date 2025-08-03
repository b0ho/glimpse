import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ClerkAuthRequest } from '../middleware/clerkAuth';
import { createError } from '../middleware/errorHandler';
import { matchingService } from '../services/MatchingService';
import { matchingStatisticsService } from '../services/MatchingStatisticsService';
import { recordMatch, recordLike } from '../middleware/metrics';

/**
 * 매칭 컨트롤러 - 매칭 및 추천 기능
 * @class MatchController
 */
export class MatchController {
  /**
   * 사용자의 매칭 목록 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (query: status, page, limit)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getMatches(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;
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

  /**
   * 특정 매칭 상세 정보 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: matchId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getMatchById(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { matchId } = req.params;
      const userId = req.auth.userId;
      
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

  /**
   * 매칭 삭제
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: matchId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async deleteMatch(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { matchId } = req.params;
      const userId = req.auth.userId;
      
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

  /**
   * 사용자의 매칭 통계 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getMatchStats(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;

      const stats = await matchingStatisticsService.getUserMatchingStatistics(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매칭 추천 목록 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (query: groupId, count)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getRecommendations(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;
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

  /**
   * 매칭 신고
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: matchId, body: reason, description)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async reportMatch(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { matchId } = req.params;
      const { reason, description } = req.body;
      const userId = req.auth.userId;
      
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

  /**
   * 매칭 기간 연장 (프리미엄 전용)
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: matchId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async extendMatch(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { matchId } = req.params;
      const userId = req.auth.userId;
      
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

  /**
   * 매칭 이력 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (query: page, limit, groupId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getMatchingHistory(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;
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

  /**
   * 상호 연결 관계 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: matchId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getMutualConnections(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { matchId } = req.params;
      const userId = req.auth.userId;
      
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

export const matchController = new MatchController();