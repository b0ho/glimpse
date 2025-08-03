import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

/**
 * 404 Not Found 미들웨어 - 없는 라우트 처리
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {void}
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = createError(404, `Resource not found - ${req.originalUrl}`);
  next(error);
};