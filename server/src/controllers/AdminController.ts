import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/AdminService';
import { createError } from '../middleware/errorHandler';

export class AdminController {
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