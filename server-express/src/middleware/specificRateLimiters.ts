import rateLimit from 'express-rate-limit';
import { createError } from './errorHandler';

/**
 * 파일 업로드 속도 제한기
 * @constant
 * @description 사용자당 시간당 10개 파일 업로드 제한
 */
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

/**
 * 좋아요 전송 속도 제한기
 * @constant
 * @description 사용자당 분당 30개 좋아요 제한
 */
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

/**
 * 결제 생성 속도 제한기
 * @constant
 * @description 사용자당 시간당 5회 결제 시도 제한
 */
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

/**
 * 웹훅 속도 제한기
 * @constant
 * @description IP당 분당 100개 웹훅 요청 제한
 */
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

/**
 * 프리미엄 API 속도 제한기
 * @constant
 * @description 프리미엄 사용자: 시간당 1000개, 일반 사용자: 시간당 100개 요청 제한
 */
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