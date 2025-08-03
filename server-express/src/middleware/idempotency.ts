import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/CacheService';
import { createError } from './errorHandler';
import crypto from 'crypto';

/**
 * 멱등성 옵션 인터페이스
 * @interface IdempotencyOptions
 */
interface IdempotencyOptions {
  /** TTL (초 단위) */
  ttl?: number;
  /** 키 생성 함수 */
  generateKey?: (req: Request) => string;
}

/**
 * 멱등성 미들웨어 - 중복 요청 처리 방지
 * @param {IdempotencyOptions} [options={}] - 멱등성 옵션
 * @returns {Function} Express 미들웨어 함수
 * @description 동일한 요청의 중복 처리를 방지하여 데이터 무결성 보장
 */
export const idempotent = (options: IdempotencyOptions = {}) => {
  const { ttl = 86400, generateKey } = options; // Default 24 hours
  
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only apply to mutation requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Get or generate idempotency key
    const idempotencyKey = req.headers['idempotency-key'] as string || 
                          req.headers['x-idempotency-key'] as string;
    
    if (!idempotencyKey) {
      // If no key provided, optionally generate one based on request
      if (generateKey) {
        const generatedKey = generateKey(req);
        req.headers['x-idempotency-key'] = generatedKey;
      } else {
        // For critical operations, require idempotency key
        if (req.path.includes('/payments/') || req.path.includes('/transfer')) {
          return next(createError(400, 'Idempotency-Key header is required'));
        }
        return next();
      }
    }
    
    const cacheKey = `idempotency:${idempotencyKey}`;
    
    try {
      // Check if request was already processed
      const cachedResponse = await cacheService.get<{
        status: number;
        body: any;
        headers: Record<string, string>;
      }>(cacheKey);
      
      if (cachedResponse) {
        // Return cached response
        Object.entries(cachedResponse.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        res.setHeader('X-Idempotent-Replayed', 'true');
        return res.status(cachedResponse.status).json(cachedResponse.body);
      }
      
      // Store original res.json to intercept response
      const originalJson = res.json;
      const originalStatus = res.status;
      let responseData: any;
      let statusCode: number = 200;
      
      // Override res.status to capture status code
      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };
      
      // Override res.json to capture response
      res.json = function(data: any) {
        responseData = data;
        
        // Only cache successful responses
        if (statusCode >= 200 && statusCode < 300) {
          const responseToCache = {
            status: statusCode,
            body: data,
            headers: {
              'Content-Type': 'application/json',
              'X-Idempotent-Cached': new Date().toISOString()
            }
          };
          
          // Store response asynchronously
          cacheService.set(cacheKey, responseToCache, { ttl }).catch(err => {
            console.error('Failed to cache idempotent response:', err);
          });
        }
        
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Idempotency middleware error:', error);
      next();
    }
  };
};

/**
 * 멱등성 키 생성
 * @param {Request} req - Express 요청 객체
 * @returns {string} 생성된 멱등성 키 (SHA256 해시)
 * @description 사용자 ID, HTTP 메소드, 경로, 본문을 기반으로 고유 키 생성
 */
export const generateIdempotencyKey = (req: Request): string => {
  const userId = (req as any).user?.id || 'anonymous';
  const method = req.method;
  const path = req.path;
  const body = JSON.stringify(req.body || {});
  
  const data = `${userId}:${method}:${path}:${body}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * 멱등성 키 필수 미들웨어 - 특정 라우트에 멱등성 키 요구
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {void | Response}
 * @throws {Error} 멱등성 키 없음 (400), 잘못된 형식 (400)
 */
export const requireIdempotencyKey = (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  
  if (!idempotencyKey) {
    return next(createError(400, 'Idempotency-Key header is required for this operation'));
  }
  
  // Validate key format (should be UUID or similar)
  const keyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^[0-9a-f]{32,64}$/i;
  if (!keyPattern.test(idempotencyKey as string)) {
    return next(createError(400, 'Invalid Idempotency-Key format'));
  }
  
  next();
};