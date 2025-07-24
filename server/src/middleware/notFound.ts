import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = createError(404, `Resource not found - ${req.originalUrl}`);
  next(error);
};