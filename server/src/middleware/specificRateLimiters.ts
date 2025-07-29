import rateLimit from 'express-rate-limit';
import { createError } from './errorHandler';

// File upload rate limiter (10 uploads per hour per user)
export const fileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: '파일 업로드 한도를 초과했습니다. 1시간 후에 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use authenticated user ID for rate limiting
    return (req as any).auth?.userId || req.ip;
  },
  handler: (req, res) => {
    throw createError(429, '파일 업로드 한도를 초과했습니다. 1시간 후에 다시 시도해주세요.');
  }
});

// Like sending rate limiter (30 likes per minute per user)
export const likeSendingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: '좋아요 전송 속도가 너무 빠릅니다. 잠시 후에 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).auth?.userId || req.ip;
  },
  handler: (req, res) => {
    throw createError(429, '좋아요 전송 속도가 너무 빠릅니다. 잠시 후에 다시 시도해주세요.');
  }
});

// Payment creation rate limiter (5 attempts per hour per user)
export const paymentCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: '결제 시도 횟수를 초과했습니다. 1시간 후에 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).auth?.userId || req.ip;
  },
  handler: (req, res) => {
    throw createError(429, '결제 시도 횟수를 초과했습니다. 1시간 후에 다시 시도해주세요.');
  }
});

// Webhook rate limiter (100 requests per minute per IP)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    throw createError(429, 'Too many webhook requests');
  }
});

// Premium API rate limiter (1000 requests per hour for premium users)
export const premiumApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req) => {
    // Check if user is premium
    const userId = (req as any).auth?.userId;
    if (!userId) return 100; // Default for unauthenticated

    const { prisma } = await import('../config/database');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true }
    });

    return user?.isPremium ? 1000 : 100; // Premium users get 10x limit
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).auth?.userId || req.ip;
  }
});