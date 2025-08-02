import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/AdminService';
import { createError } from '../middleware/errorHandler';

/**
 * 관리자 컨트롤러 - 관리자 대시보드 및 시스템 관리 기능
 * @class AdminController
 */
export class AdminController {
  /**
   * 대시보드 통계 조회
   * @param {Request} req - Express request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 목록 조회
   * @param {Request} req - Express request 객체 (query: page, limit, search, isPremium, isVerified, sortBy, sortOrder)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, search, isPremium, isVerified, sortBy, sortOrder } = req.query;

      const result = await adminService.getUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        isPremium: isPremium === 'true' ? true : isPremium === 'false' ? false : undefined,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 특정 사용자 상세 정보 조회
   * @param {Request} req - Express request 객체 (params: userId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getUserDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw createError(400, '사용자 ID가 필요합니다.');
      }

      const user = await adminService.getUserDetail(userId);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 목록 조회
   * @param {Request} req - Express request 객체 (query: page, limit, search, type, isActive)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, search, type, isActive } = req.query;

      const result = await adminService.getGroups({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        type: type as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 신고 목록 조회
   * @param {Request} req - Express request 객체 (query: page, limit, status, type)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, status, type } = req.query;

      const result = await adminService.getReports({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as any,
        type: type as string
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 수익 분석 데이터 조회
   * @param {Request} req - Express request 객체 (query: period)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getRevenueAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = 'month' } = req.query;

      const analytics = await adminService.getRevenueAnalytics(period as any);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 활동 분석 데이터 조회
   * @param {Request} req - Express request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getUserActivityAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await adminService.getUserActivityAnalytics();

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 차단/차단 해제
   * @param {Request} req - Express request 객체 (params: userId, body: block)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async toggleUserBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { block } = req.body;

      if (!userId) {
        throw createError(400, '사용자 ID가 필요합니다.');
      }

      if (block === undefined) {
        throw createError(400, '차단 여부가 필요합니다.');
      }

      const result = await adminService.toggleUserBlock(userId, block);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 활성화/비활성화
   * @param {Request} req - Express request 객체 (params: groupId, body: active)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async toggleGroupActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groupId } = req.params;
      const { active } = req.body;

      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }

      if (active === undefined) {
        throw createError(400, '활성화 여부가 필요합니다.');
      }

      const result = await adminService.toggleGroupActive(groupId, active);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 시스템 설정 조회
   * @param {Request} req - Express request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getSystemSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await adminService.getSystemSettings();

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 시스템 설정 업데이트
   * @param {Request} req - Express request 객체 (body: settings)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async updateSystemSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = req.body;

      const updated = await adminService.updateSystemSettings(settings);

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();