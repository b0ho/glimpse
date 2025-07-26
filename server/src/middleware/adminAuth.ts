import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/AdminService';
import { createError } from './errorHandler';

export async function adminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).auth?.userId;

    if (!userId) {
      throw createError(401, '인증이 필요합니다.');
    }

    const isAdmin = await adminService.isAdmin(userId);

    if (!isAdmin) {
      throw createError(403, '관리자 권한이 필요합니다.');
    }

    next();
  } catch (error) {
    next(error);
  }
}