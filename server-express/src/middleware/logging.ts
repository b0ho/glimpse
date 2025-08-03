import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * 사용자 정의 로그 포맷
 * @constant
 * @description 타임스탬프, 에러 스택, JSON 형식 포함
 */
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

/**
 * Winston 로거 인스턴스
 * @constant
 * @description 애플리케이션 전체에서 사용하는 로거
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'glimpse-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports
});

/**
 * 요청 컨텍스트 인터페이스
 * @interface RequestContext
 * @description 요청별 컨텍스트 정보 저장
 */
export interface RequestContext {
  /** 요청 ID */
  requestId: string;
  /** 사용자 ID */
  userId?: string;
  /** HTTP 메소드 */
  method: string;
  /** 요청 경로 */
  path: string;
  /** IP 주소 */
  ip: string;
  /** User-Agent */
  userAgent?: string;
  /** 시작 시간 */
  startTime: number;
}

/**
 * 비동기 로컬 스토리지 - 요청 컨텍스트 관리
 * @constant
 * @description 요청별 컨텍스트를 비동기 작업에서도 유지
 */
import { AsyncLocalStorage } from 'async_hooks';
export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * 요청 로깅 미들웨어 - 모든 HTTP 요청/응답 로깅
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {void}
 */
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

/**
 * 에러 로깅 미들웨어 - 처리되지 않은 에러 로깅
 * @param {any} err - 에러 객체
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {void}
 */
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

/**
 * 정보 로그 기록
 * @param {string} message - 로그 메시지
 * @param {any} [meta] - 추가 메타데이터
 * @returns {void}
 */
export const logInfo = (message: string, meta?: any) => {
  const context = requestContext.getStore();
  logger.info(message, {
    ...meta,
    requestId: context?.requestId,
    userId: context?.userId
  });
};

/**
 * 에러 로그 기록
 * @param {string} message - 로그 메시지
 * @param {any} error - 에러 객체
 * @param {any} [meta] - 추가 메타데이터
 * @returns {void}
 */
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

/**
 * 경고 로그 기록
 * @param {string} message - 로그 메시지
 * @param {any} [meta] - 추가 메타데이터
 * @returns {void}
 */
export const logWarn = (message: string, meta?: any) => {
  const context = requestContext.getStore();
  logger.warn(message, {
    ...meta,
    requestId: context?.requestId,
    userId: context?.userId
  });
};

/**
 * 디버그 로그 기록
 * @param {string} message - 로그 메시지
 * @param {any} [meta] - 추가 메타데이터
 * @returns {void}
 */
export const logDebug = (message: string, meta?: any) => {
  const context = requestContext.getStore();
  logger.debug(message, {
    ...meta,
    requestId: context?.requestId,
    userId: context?.userId
  });
};

/**
 * 성능 로그 기록
 * @param {string} operation - 작업 이름
 * @param {number} duration - 소요 시간 (ms)
 * @param {any} [meta] - 추가 메타데이터
 * @returns {void}
 */
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

/**
 * 데이터베이스 쿼리 로그 기록
 * @param {string} query - SQL 쿼리
 * @param {number} duration - 소요 시간 (ms)
 * @param {any} [params] - 쿼리 파라미터
 * @returns {void}
 */
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

/**
 * 외부 API 호출 로그 기록
 * @param {string} service - 서비스 이름
 * @param {string} method - HTTP 메소드
 * @param {string} url - 요청 URL
 * @param {number} duration - 소요 시간 (ms)
 * @param {number} [statusCode] - HTTP 상태 코드
 * @param {any} [error] - 에러 객체
 * @returns {void}
 */
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