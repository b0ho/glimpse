import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/CacheService';
import { createError } from './errorHandler';
import crypto from 'crypto';

interface IdempotencyOptions {
  ttl?: number; // Time to live in seconds
  generateKey?: (req: Request) => string;
}

/**
 * Middleware for handling idempotent requests
 * Prevents duplicate processing of the same request
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
 * Generate idempotency key for a request based on user, path, and body
 */
export const generateIdempotencyKey = (req: Request): string => {
  const userId = req.user?.id || 'anonymous';
  const method = req.method;
  const path = req.path;
  const body = JSON.stringify(req.body || {});
  
  const data = `${userId}:${method}:${path}:${body}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Middleware to require idempotency key for specific routes
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