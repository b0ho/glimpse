import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

/**
 * Content Security Policy 설정
 * @constant
 * @description 콘텐츠 보안 정책 지시자 설정
 */
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Remove in production after refactoring inline scripts
      "'unsafe-eval'", // Required for some libraries, remove if possible
      "https://cdn.jsdelivr.net",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for styled-components
      "https://fonts.googleapis.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "https://*.glimpse.app"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    connectSrc: [
      "'self'",
      "wss://*.glimpse.app",
      "https://*.clerk.dev",
      "https://api.stripe.com",
      "https://kapi.kakao.com",
      "https://api.tosspayments.com"
    ],
    mediaSrc: ["'self'", "blob:"],
    objectSrc: ["'none'"],
    childSrc: ["'self'"],
    frameSrc: ["'self'", "https://js.stripe.com"],
    workerSrc: ["'self'", "blob:"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    manifestSrc: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined
  }
};

/**
 * 보안 헤더 미들웨어 - Helmet을 사용한 보안 헤더 설정
 * @constant
 * @description XSS, 클릭재킹, 스니핑 등 다양한 공격 방어
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? contentSecurityPolicy as any : false,
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

/**
 * 요청 ID 미들웨어 - 요청 추적을 위한 고유 ID 생성
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {void}
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * 보안 모니터링 미들웨어 - 의심스러운 요청 탐지
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {void}
 */
export const securityMonitoring = (req: Request, res: Response, next: NextFunction) => {
  // Log suspicious activities
  const suspiciousPatterns = [
    /(\.\.|\/\/)/,  // Path traversal
    /<script/i,      // XSS attempts
    /union.*select/i, // SQL injection
    /eval\(/i,       // Code injection
    /base64/i        // Encoded payloads
  ];

  const url = req.url + (req.originalUrl || '');
  const body = JSON.stringify(req.body || {});
  const headers = JSON.stringify(req.headers || {});

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body) || pattern.test(headers)) {
      console.warn(`[SECURITY] Suspicious request detected:`, {
        requestId: req.id,
        ip: req.ip,
        method: req.method,
        url: req.url,
        pattern: pattern.toString(),
        timestamp: new Date().toISOString()
      });
      
      // Track suspicious activity in metrics
      import('../utils/monitoring').then(({ metrics }) => {
        metrics.securitySuspiciousRequestsTotal.labels(pattern.toString()).inc();
      });
      
      // In production, you might want to:
      // - Send to SIEM
      // - Block the request
      // - Rate limit the IP
      break;
    }
  }

  next();
};

/**
 * API 키 인증 미들웨어 - 내부 서비스용
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {void | Response}
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void | Response => {
  const apiKey = req.headers['x-api-key'];
  
  if (req.path.startsWith('/internal/')) {
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
  }
  
  next();
};

/**
 * 안전한 문자열 비교 - 타이밍 공격 방어
 * @param {string} a - 첫 번째 문자열
 * @param {string} b - 두 번째 문자열
 * @returns {boolean} 두 문자열이 같은지 여부
 */
export const safeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

/**
 * 모든 보안 미들웨어 적용
 * @param {any} app - Express 애플리케이션 인스턴스
 * @returns {void}
 */
export const applySecurity = (app: any) => {
  // Basic security headers
  app.use(securityHeaders);
  
  // Request tracking
  app.use(requestId);
  
  // Security monitoring
  app.use(securityMonitoring);
  
  // API key authentication for internal endpoints
  app.use(apiKeyAuth);
  
  // Disable X-Powered-By header
  app.disable('x-powered-by');
  
  // Prevent parameter pollution
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Clean up duplicate query parameters
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = (req.query[key] as string[])[0];
      }
    }
    next();
  });
};

/**
 * Express Request 타입 확장
 * @global
 * @description 요청 ID를 Request 객체에 추가
 */
declare global {
  namespace Express {
    interface Request {
      /** 요청 ID */
      id?: string;
    }
  }
}