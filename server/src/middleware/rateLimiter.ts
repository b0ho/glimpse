import rateLimit from 'express-rate-limit';

/**
 * 기본 속도 제한 미들웨어 - IP별 요청 수 제한
 * @constant
 * @description 15분당 IP별 최대 100개 요청 허용
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * 인증 속도 제한 미들웨어 - 인증 시도 횟수 제한
 * @constant
 * @description 15분당 IP별 최대 5개 인증 요청 허용 (보안 강화)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: {
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});