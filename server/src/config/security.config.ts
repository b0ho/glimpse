/**
 * 보안 설정 모듈
 *
 * 애플리케이션의 보안 관련 설정을 중앙 집중화합니다.
 */

export const SecurityConfig = {
  // 파일 업로드 설정
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: {
      profileImage: ['image/jpeg', 'image/png', 'image/webp'],
      chatImage: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      document: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    uploadPath: 'uploads/', // S3 업로드 경로
  },

  // 인증 설정
  auth: {
    tokenExpiry: '7d',
    refreshTokenExpiry: '30d',
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15분
    passwordMinLength: 8,
    requireStrongPassword: true,
  },

  // 레이트 리미팅 설정
  rateLimit: {
    global: {
      windowMs: 15 * 60 * 1000, // 15분
      max: 1000, // 최대 요청 수
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 5, // 인증 시도 제한
    },
    sms: {
      windowMs: 60 * 60 * 1000, // 1시간
      max: 3, // SMS 전송 제한
    },
    email: {
      windowMs: 60 * 60 * 1000,
      max: 10, // 이메일 전송 제한
    },
  },

  // CORS 설정
  cors: {
    development: {
      origins: [
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:19000',
        'http://localhost:3000',
        'http://localhost:3001',
        'exp://192.168.0.2:8081',
      ],
    },
    production: {
      origins: [
        // 운영 도메인 추가
        process.env.CLIENT_URL,
        process.env.WEB_URL,
      ].filter(Boolean),
    },
  },

  // 암호화 설정
  encryption: {
    algorithm: 'aes-256-gcm',
    ivLength: 16,
    saltLength: 32,
    tagLength: 16,
    keyDerivationIterations: 100000,
  },

  // 세션 설정
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },

  // 보안 헤더 설정
  headers: {
    contentSecurityPolicy: {
      development: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      production: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // React Native 필요
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },

  // 로깅 설정
  logging: {
    sensitiveFields: [
      'password',
      'token',
      'refreshToken',
      'creditCardNumber',
      'cvv',
      'ssn',
      'phoneNumber',
      'email',
    ],
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  },

  // 입력 검증 설정
  validation: {
    maxStringLength: 10000,
    maxArrayLength: 1000,
    maxObjectDepth: 10,
    allowedHtmlTags: [], // XSS 방지를 위해 HTML 태그 허용 안 함
  },
};

export default SecurityConfig;
