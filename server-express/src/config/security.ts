/**
 * @module Security
 * @description 보안 설정 및 미들웨어 관리
 * 
 * 애플리케이션의 전반적인 보안을 담당하는 설정들을 관리합니다.
 * HTTP 보안 헤더, 요청 제한, 입력값 검증, XSS/CSRF 방지 등
 * 다양한 보안 메커니즘을 제공합니다.
 * 
 * 주요 보안 기능:
 * - HTTP 보안 헤더 설정 (Helmet)
 * - API 요청 속도 제한 (Rate Limiting)
 * - NoSQL 인젝션 방지
 * - XSS 공격 방지
 * - CSRF 공격 방지
 * - 파일 업로드 보안
 * - 비밀번호 정책 관리
 * 
 * 보안 표준:
 * - OWASP Top 10 보안 취약점 대응
 * - CSP (Content Security Policy) 적용
 * - HTTPS 강제 (프로덕션)
 * - 보안 헤더 최적화
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { Express } from 'express';
import env from './env';

/**
 * HTTP 보안 헤더 설정
 * 
 * Helmet을 사용하여 다양한 보안 헤더를 설정합니다.
 * XSS, 클릭재킹, MIME 스니핑 등의 공격을 방지합니다.
 * 
 * 설정된 보안 정책:
 * - Content Security Policy (CSP)
 * - Cross-Origin Embedder Policy
 * - 안전한 리소스 로딩 정책
 * 
 * @constant {Function}
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: [
        "'self'",
        env.FRONTEND_URL,
        'https://api.stripe.com',
        'https://api.tosspayments.com',
        'https://kapi.kakao.com',
        'https://sentry.io',
        'wss://*.sentry.io',
      ],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
});

/**
 * 인증 관련 요청 제한 설정
 * 
 * 무차별 대입 공격을 방지하기 위해 인증 관련 엔드포인트의
 * 요청 횟수를 제한합니다. 로그인, 회원가입, 비밀번호 재설정 등에 적용됩니다.
 * 
 * 제한 정책:
 * - 15분 동안 최대 5회 시도
 * - 개발 환경에서는 제한 비활성화
 * 
 * @constant {rateLimit.RateLimitRequestHandler}
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: '인증 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'development',
});

/**
 * 일반 API 요청 제한 설정
 * 
 * 일반적인 API 엔드포인트에 대한 요청 횟수를 제한하여
 * 서버 리소스를 보호하고 악의적인 사용을 방지합니다.
 * 
 * 제한 정책:
 * - 15분 동안 최대 100회 요청
 * - 개발 환경에서는 제한 비활성화
 * 
 * @constant {rateLimit.RateLimitRequestHandler}
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'development',
});

/**
 * 엄격한 요청 제한 설정
 * 
 * 민감한 작업이나 리소스 집약적인 엔드포인트에 적용되는
 * 엄격한 요청 제한입니다. 결제, 파일 업로드 등에 사용됩니다.
 * 
 * 제한 정책:
 * - 1분 동안 최대 10회 요청
 * - 모든 환경에서 활성화
 * 
 * @constant {rateLimit.RateLimitRequestHandler}
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 보안 미들웨어 설정 함수
 * 
 * Express 애플리케이션에 모든 보안 미들웨어를 적용합니다.
 * 보안 헤더, NoSQL 인젝션 방지, 추가 보안 정책 등을 설정합니다.
 * 
 * 적용되는 보안 미들웨어:
 * - Helmet 보안 헤더
 * - NoSQL 인젝션 방지
 * - 클릭재킹 방지
 * - MIME 타입 스니핑 방지
 * - XSS 필터
 * - 권한 정책
 * - HSTS (프로덕션 환경)
 * 
 * @param app - Express 애플리케이션 인스턴스
 */
export function setupSecurity(app: Express) {
  // Basic security headers
  app.use(helmetConfig);
  
  // Prevent NoSQL injection attacks
  app.use(mongoSanitize());
  
  // Additional security headers
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(self)'
    );
    
    // HSTS for production
    if (env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }
    
    next();
  });
  
  // Remove powered-by header
  app.disable('x-powered-by');
  
  // Trust proxy for production
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
}

/**
 * 입력값 검증 스키마
 * 
 * 사용자 입력값의 형식을 검증하는 정규식 패턴들입니다.
 * 보안과 데이터 무결성을 위해 엄격한 검증을 수행합니다.
 * 
 * @constant {Object}
 */
export const validationSchemas = {
  phoneNumber: /^01[0-9]{1}-?[0-9]{3,4}-?[0-9]{4}$/,
  nickname: /^[가-힣a-zA-Z0-9_]{2,20}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
};

/**
 * SQL 인젝션 탐지 패턴
 * 
 * SQL 인젝션 공격을 탐지하고 방지하기 위한 정규식 패턴들입니다.
 * 악의적인 SQL 문법이나 스크립트 삽입 시도를 차단합니다.
 * 
 * @constant {RegExp[]}
 */
export const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(--|\/\*|\*\/|xp_|sp_|<script|<\/script|javascript:|onerror=|onload=)/gi,
];

/**
 * XSS 공격 방지를 위한 입력값 정화
 * 
 * 사용자 입력에서 HTML 특수문자를 이스케이프하여
 * 크로스 사이트 스크립팅(XSS) 공격을 방지합니다.
 * 
 * @param input - 정화할 입력 문자열
 * @returns 이스케이프된 안전한 문자열
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * 파일 업로드 보안 설정
 * 
 * 파일 업로드 시 보안을 위한 제약사항들을 정의합니다.
 * 허용된 파일 타입과 크기만 업로드할 수 있도록 제한합니다.
 * 
 * @constant {Object}
 */
export const fileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};

/**
 * 비밀번호 복잡성 요구사항
 * 
 * 강력한 비밀번호 생성을 위한 정책을 정의합니다.
 * 보안성을 높이기 위해 다양한 문자 유형을 요구합니다.
 * 
 * 요구사항:
 * - 최소 8자 이상
 * - 대문자, 소문자, 숫자, 특수문자 포함
 * 
 * @constant {Object}
 */
export const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '@$!%*#?&',
};

/**
 * 세션 설정
 * 
 * 사용자 세션 관리를 위한 보안 설정입니다.
 * JWT 토큰과 함께 사용되어 사용자 인증 상태를 안전하게 유지합니다.
 * 
 * 보안 기능:
 * - HttpOnly 쿠키로 XSS 방지
 * - Secure 쿠키로 HTTPS 강제
 * - SameSite 정책으로 CSRF 방지
 * 
 * @constant {Object}
 */
export const sessionConfig = {
  secret: env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const,
  },
};

/**
 * CORS (Cross-Origin Resource Sharing) 설정
 * 
 * 크로스 도메인 요청을 안전하게 처리하기 위한 설정입니다.
 * 허용된 도메인에서만 API 접근을 허용하여 보안성을 강화합니다.
 * 
 * 허용 대상:
 * - 프론트엔드 도메인
 * - 로컬 개발 서버
 * - 모바일 앱 (도메인 없는 요청)
 * 
 * @constant {Object}
 */
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      env.FRONTEND_URL,
      'http://localhost:8081',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};