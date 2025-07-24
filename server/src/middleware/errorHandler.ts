import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = error;

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
      message: 'Something went wrong!'
    }
  });
};

export const createError = (statusCode: number, message: string): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};