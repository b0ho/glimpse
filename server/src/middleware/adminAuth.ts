import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/AdminService';
import { createError } from './errorHandler';

/**
 * 관리자 인증 미들웨어 - 관리자 권한 확인
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {Promise<void>}
 * @throws {Error} 인증 필요 (401), 관리자 권한 필요 (403)
 */
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