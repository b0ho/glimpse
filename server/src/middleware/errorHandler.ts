import { Request, Response, NextFunction } from 'express';

/**
 * 애플리케이션 에러 인터페이스
 * @interface AppError
 * @extends {Error}
 */
export interface AppError extends Error {
  /** HTTP 상태 코드 */
  statusCode?: number;
  /** 예상 가능한 에러 여부 */
  isOperational?: boolean;
}

/**
 * 에러 처리 미들웨어 - 중앙 집중식 에러 처리
 * @param {AppError} error - 에러 객체
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} _next - 다음 미들웨어 함수 (사용 안 함)
 * @returns {Response} 에러 응답
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const { statusCode = 500, message } = error;

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
    return res.status(statusCode).json({
      error: {
        message,
        stack: error.stack,
        statusCode: error.statusCode,
        isOperational: error.isOperational
      }
    });
  }

  // Production error response
  if (error.isOperational) {
    return res.status(statusCode).json({
      error: {
        message
      }
    });
  }

  // Log error for debugging
  console.error('Unexpected error:', error);

  // Don't leak error details in production
  return res.status(500).json({
    error: {
      message: process.env.NODE_ENV === 'test' ? error.message : 'Something went wrong!'
    }
  });
};

/**
 * 사용자 정의 에러 생성
 * @param {number} statusCode - HTTP 상태 코드
 * @param {string} message - 에러 메시지
 * @returns {AppError} 생성된 에러 객체
 */
export const createError = (statusCode: number, message: string): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};