# Glimpse 보안 가이드

## 🔒 보안 개요

Glimpse는 사용자의 프라이버시와 익명성을 최우선으로 하는 데이팅 앱으로, 다음과 같은 보안 원칙을 따릅니다:

1. **최소 권한 원칙**: 필요한 최소한의 권한만 부여
2. **심층 방어**: 다층적 보안 체계 구축
3. **제로 트러스트**: 모든 요청을 검증
4. **데이터 최소화**: 필수 정보만 수집 및 보관

## 🛡 인증 및 인가

### JWT 토큰 관리

```typescript
// 토큰 구조
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "user_123",
    "role": "USER",
    "iat": 1642080000,
    "exp": 1642080900  // 15분
  }
}
```

### 토큰 보안 설정
- **Access Token**: 15분 만료
- **Refresh Token**: 7일 만료
- **저장 위치**: 
  - Mobile: Expo SecureStore
  - Server: Redis with TTL

### 토큰 갱신 전략
```typescript
// 자동 토큰 갱신 미들웨어
const refreshTokenIfNeeded = async (token: string) => {
  const decoded = jwt.decode(token);
  const now = Date.now() / 1000;
  
  // 만료 5분 전 자동 갱신
  if (decoded.exp - now < 300) {
    return await refreshToken();
  }
  return token;
};
```

## 🔐 데이터 암호화

### 1. 전송 중 암호화 (TLS)
- **최소 버전**: TLS 1.2
- **암호 스위트**: ECDHE-RSA-AES256-GCM-SHA384
- **HSTS 설정**: max-age=31536000; includeSubDomains

### 2. 저장 시 암호화

#### 민감 데이터 암호화
```typescript
// AES-256-GCM 암호화
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(data.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### 암호화 대상 데이터
- 전화번호
- 실명 (수집 시)
- 결제 정보
- 채팅 메시지
- 위치 정보

### 3. 비밀번호 해싱
```typescript
import bcrypt from 'bcrypt';

// 비밀번호 해싱 (사용 시)
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};
```

## 🚨 입력 검증 및 살균

### 1. 입력 검증 미들웨어
```typescript
import { body, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

// 사용자 입력 검증
const validateUserInput = [
  body('nickname')
    .trim()
    .isLength({ min: 2, max: 20 })
    .matches(/^[가-힣a-zA-Z0-9_]+$/)
    .withMessage('닉네임은 한글, 영문, 숫자만 가능합니다'),
  
  body('bio')
    .trim()
    .isLength({ max: 500 })
    .customSanitizer(value => DOMPurify.sanitize(value)),
  
  body('phoneNumber')
    .matches(/^\+82[0-9]{10,11}$/)
    .withMessage('올바른 전화번호 형식이 아닙니다'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 2. SQL 인젝션 방지
```typescript
// Prisma ORM 사용으로 자동 방지
// 직접 쿼리 시 파라미터 바인딩 사용
const safeQuery = await prisma.$queryRaw`
  SELECT * FROM users 
  WHERE nickname = ${userInput}
`;
```

### 3. XSS 방지
```typescript
// React Native는 기본적으로 XSS 방지
// 서버 사이드 추가 검증
const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
};
```

## 🔑 API 보안

### 1. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

// 일반 API 제한
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 100,
  message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
});

// 인증 API 제한 (더 엄격)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5,
  skipSuccessfulRequests: true
});

// 좋아요 API 제한
const likeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 20,
  keyGenerator: (req) => req.user.id
});
```

### 2. CORS 설정
```typescript
import cors from 'cors';

const corsOptions = {
  origin: [
    'https://app.glimpse.kr',
    'https://glimpse.kr',
    process.env.NODE_ENV === 'development' && 'http://localhost:19000'
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 3. 헤더 보안
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss://api.glimpse.kr"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 🕵️ 익명성 보호

### 1. 익명 ID 시스템
```typescript
// 익명 ID 생성
const generateAnonymousId = (userId: string, groupId: string): string => {
  const hash = crypto
    .createHash('sha256')
    .update(`${userId}-${groupId}-${process.env.ANON_SALT}`)
    .digest('hex');
  
  return `anon_${hash.substring(0, 12)}`;
};
```

### 2. 단계적 정보 공개
```typescript
enum PrivacyLevel {
  ANONYMOUS = 0,    // 익명 (매칭 전)
  NICKNAME = 1,     // 닉네임만 공개 (매칭 후)
  PROFILE = 2,      // 프로필 공개 (친구)
  FULL = 3          // 전체 공개 (설정에 따라)
}

const getVisibleUserInfo = (user: User, privacyLevel: PrivacyLevel) => {
  switch (privacyLevel) {
    case PrivacyLevel.ANONYMOUS:
      return {
        anonymousId: user.anonymousId,
        bio: user.bio,
        interests: user.interests
      };
    case PrivacyLevel.NICKNAME:
      return {
        ...getVisibleUserInfo(user, PrivacyLevel.ANONYMOUS),
        nickname: user.nickname
      };
    // ...
  }
};
```

## 🔍 보안 모니터링

### 1. 로깅 전략
```typescript
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'security.log',
      level: 'warn' 
    })
  ]
});

// 보안 이벤트 로깅
securityLogger.warn('Failed login attempt', {
  ip: req.ip,
  phoneNumber: req.body.phoneNumber,
  timestamp: new Date()
});
```

### 2. 이상 탐지
```typescript
// 비정상적인 활동 감지
const detectAnomalies = async (userId: string) => {
  const recentActivity = await getRecentActivity(userId);
  
  // 단시간 내 과도한 좋아요
  if (recentActivity.likes > 50) {
    await flagAccount(userId, 'EXCESSIVE_LIKES');
  }
  
  // 여러 IP에서 동시 접속
  if (recentActivity.uniqueIPs > 3) {
    await flagAccount(userId, 'MULTIPLE_IPS');
  }
  
  // 비정상적인 메시지 패턴
  if (recentActivity.messageRate > 100) {
    await flagAccount(userId, 'SPAM_SUSPECTED');
  }
};
```

## 🚫 취약점 대응

### 1. 의존성 관리
```bash
# 정기적인 취약점 스캔
npm audit
npm audit fix

# Snyk 통합
snyk test
snyk monitor
```

### 2. 보안 테스트
```typescript
// 보안 테스트 예시
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/users/search')
      .send({ query: maliciousInput });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
  
  it('should enforce rate limits', async () => {
    const requests = Array(101).fill(null).map(() =>
      request(app).get('/api/users')
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

## 📱 모바일 앱 보안

### 1. 안전한 저장소
```typescript
import * as SecureStore from 'expo-secure-store';

// 민감한 데이터 저장
await SecureStore.setItemAsync('auth_token', token, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
});

// 앱 삭제 시 자동 삭제
await SecureStore.deleteItemAsync('auth_token');
```

### 2. 인증서 고정 (Certificate Pinning)
```typescript
// API 클라이언트 설정
const apiClient = axios.create({
  baseURL: 'https://api.glimpse.kr',
  httpsAgent: new https.Agent({
    ca: PINNED_CERTIFICATE
  })
});
```

### 3. 코드 난독화
```javascript
// metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      keep_fnames: false,
      mangle: true,
      toplevel: true
    }
  }
};
```

## 🔐 결제 보안

### 1. PCI DSS 준수
- 카드 정보 저장 금지
- 토큰화 사용 (Stripe/TossPay)
- 안전한 결제 프로세스

### 2. 웹훅 검증
```typescript
// Stripe 웹훅 검증
const verifyStripeWebhook = (payload: string, signature: string) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (err) {
    throw new Error('Invalid webhook signature');
  }
};
```

## 🚨 사고 대응

### 1. 보안 사고 대응 절차
1. **탐지**: 로그 모니터링, 사용자 신고
2. **격리**: 영향받은 계정/서비스 격리
3. **분석**: 원인 파악 및 영향 범위 확인
4. **복구**: 시스템 복구 및 패치 적용
5. **개선**: 재발 방지 대책 수립

### 2. 데이터 유출 대응
```typescript
// 데이터 유출 시 사용자 알림
const notifyDataBreach = async (affectedUsers: string[]) => {
  for (const userId of affectedUsers) {
    await sendNotification(userId, {
      type: 'SECURITY_ALERT',
      title: '보안 알림',
      message: '계정 보안을 위해 비밀번호를 변경해주세요.',
      priority: 'HIGH'
    });
    
    // 강제 로그아웃
    await invalidateUserSessions(userId);
  }
};
```

## 📋 보안 체크리스트

### 개발 단계
- [ ] 입력 검증 구현
- [ ] 출력 인코딩 적용
- [ ] 인증/인가 확인
- [ ] 암호화 적용
- [ ] 에러 메시지 검토

### 배포 전
- [ ] 보안 테스트 실행
- [ ] 의존성 취약점 스캔
- [ ] 환경 변수 확인
- [ ] HTTPS 설정 확인
- [ ] 로깅 설정 검토

### 운영 중
- [ ] 정기 보안 감사
- [ ] 로그 모니터링
- [ ] 취약점 패치 적용
- [ ] 사고 대응 훈련
- [ ] 보안 정책 업데이트