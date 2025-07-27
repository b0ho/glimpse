import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');

// Configure transports
const transports: winston.transport[] = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// File transports with rotation
transports.push(
  // All logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat
  }),
  // Error logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'glimpse-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports
});

// Request context storage
export interface RequestContext {
  requestId: string;
  userId?: string;
  method: string;
  path: string;
  ip: string;
  userAgent?: string;
  startTime: number;
}

// Async local storage for request context
import { AsyncLocalStorage } from 'async_hooks';
export const requestContext = new AsyncLocalStorage<RequestContext>();

// Enhanced request logging middleware
export const requestLoggingMiddleware = (req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  req.requestId = requestId;

  // Create request context
  const context: RequestContext = {
    requestId,
    userId: (req as any).auth?.userId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent'),
    startTime
  };

  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: context.ip,
    userAgent: context.userAgent,
    userId: context.userId
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data: any) {
    res.send = originalSend;
    const responseTime = Date.now() - startTime;

    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      userId: context.userId,
      contentLength: res.get('content-length')
    });

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        path: req.path,
        responseTime,
        threshold: 1000
      });
    }

    // Log errors
    if (res.statusCode >= 400) {
      const level = res.statusCode >= 500 ? 'error' : 'warn';
      logger[level]('Request failed', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        userId: context.userId,
        error: data
      });
    }

    return originalSend.call(this, data);
  };

  // Run the rest of the request in context
  requestContext.run(context, () => {
    next();
  });
};

// Enhanced error logging
export const errorLoggingMiddleware = (err: any, req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
  const context = requestContext.getStore();
  
  logger.error('Unhandled error', {
    requestId: req.requestId || context?.requestId,
    method: req.method,
    path: req.path,
    userId: context?.userId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode || 500
    }
  });

  next(err);
};

// Structured logging helpers
export const logInfo = (message: string, meta?: any) => {
  const context = requestContext.getStore();
  logger.info(message, {
    ...meta,
    requestId: context?.requestId,
    userId: context?.userId
  });
};

export const logError = (message: string, error: any, meta?: any) => {
  const context = requestContext.getStore();
  logger.error(message, {
    ...meta,
    requestId: context?.requestId,
    userId: context?.userId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    }
  });
};

export const logWarn = (message: string, meta?: any) => {
  const context = requestContext.getStore();
  logger.warn(message, {
    ...meta,
    requestId: context?.requestId,
    userId: context?.userId
  });
};

export const logDebug = (message: string, meta?: any) => {
  const context = requestContext.getStore();
  logger.debug(message, {
    ...meta,
    requestId: context?.requestId,
    userId: context?.userId
  });
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  const context = requestContext.getStore();
  const level = duration > 1000 ? 'warn' : 'info';
  
  logger[level](`Performance: ${operation}`, {
    ...meta,
    requestId: context?.requestId,
    userId: context?.userId,
    operation,
    duration,
    slow: duration > 1000
  });
};

// Database query logging
export const logDatabaseQuery = (query: string, duration: number, params?: any) => {
  const context = requestContext.getStore();
  
  logger.debug('Database query', {
    requestId: context?.requestId,
    userId: context?.userId,
    query: query.substring(0, 500), // Truncate long queries
    duration,
    slow: duration > 100,
    params: process.env.NODE_ENV === 'development' ? params : undefined
  });
};

// External API call logging
export const logApiCall = (service: string, method: string, url: string, duration: number, statusCode?: number, error?: any) => {
  const context = requestContext.getStore();
  const level = error || statusCode! >= 400 ? 'error' : 'info';
  
  logger[level](`External API call: ${service}`, {
    requestId: context?.requestId,
    userId: context?.userId,
    service,
    method,
    url,
    duration,
    statusCode,
    error: error ? {
      name: error.name,
      message: error.message,
      code: error.code
    } : undefined
  });
};