# Glimpse 테스트 가이드

## 🧪 테스트 전략 개요

Glimpse는 데이팅 앱의 특성상 사용자 데이터 보안과 안정성이 매우 중요합니다. 따라서 다음과 같은 테스트 전략을 적용합니다:

- **테스트 피라미드**: 단위 테스트 70%, 통합 테스트 20%, E2E 테스트 10%
- **커버리지 목표**: 전체 80% 이상, 핵심 비즈니스 로직 95% 이상
- **자동화**: 모든 테스트는 CI/CD 파이프라인에서 자동 실행

## 📊 테스트 종류별 가이드

### 1. 단위 테스트 (Unit Tests)

#### 1.1 서버 단위 테스트

**테스트 도구**: Jest, ts-jest

**파일 구조**:
```
server/
├── src/
│   ├── services/
│   │   ├── UserService.ts
│   │   └── UserService.test.ts  # 같은 폴더에 .test.ts 파일
│   └── utils/
│       ├── encryption.ts
│       └── encryption.test.ts
```

**테스트 작성 예시**:
```typescript
// UserService.test.ts
import { UserService } from './UserService';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user with encrypted phone number', async () => {
      const mockUser = {
        id: 'user_123',
        nickname: '테스트유저',
        phoneNumber: 'encrypted_phone'
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.createUser({
        nickname: '테스트유저',
        phoneNumber: '+821012345678'
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nickname: '테스트유저',
          phoneNumber: expect.any(String) // 암호화된 값
        })
      });
    });

    it('should throw error for duplicate phone number', async () => {
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(
        userService.createUser({
          nickname: '중복유저',
          phoneNumber: '+821012345678'
        })
      ).rejects.toThrow('이미 가입된 전화번호입니다');
    });
  });
});
```

#### 1.2 모바일 단위 테스트

**테스트 도구**: Jest, React Native Testing Library

**컴포넌트 테스트**:
```typescript
// components/LikeButton.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LikeButton } from './LikeButton';
import { useLikeStore } from '../store/likeStore';

jest.mock('../store/likeStore');

describe('LikeButton', () => {
  const mockSendLike = jest.fn();

  beforeEach(() => {
    (useLikeStore as jest.Mock).mockReturnValue({
      sendLike: mockSendLike,
      dailyLikesRemaining: 1,
      isPremium: false
    });
  });

  it('should render correctly', () => {
    const { getByTestId } = render(
      <LikeButton userId="user_123" groupId="group_456" />
    );

    expect(getByTestId('like-button')).toBeTruthy();
  });

  it('should send like when pressed', async () => {
    const { getByTestId } = render(
      <LikeButton userId="user_123" groupId="group_456" />
    );

    fireEvent.press(getByTestId('like-button'));

    await waitFor(() => {
      expect(mockSendLike).toHaveBeenCalledWith('user_123', 'group_456');
    });
  });

  it('should show alert when no likes remaining', () => {
    (useLikeStore as jest.Mock).mockReturnValue({
      sendLike: mockSendLike,
      dailyLikesRemaining: 0,
      isPremium: false
    });

    const { getByText } = render(
      <LikeButton userId="user_123" groupId="group_456" />
    );

    fireEvent.press(getByTestId('like-button'));
    
    expect(getByText('일일 좋아요를 모두 사용했습니다')).toBeTruthy();
  });
});
```

**Store 테스트**:
```typescript
// store/authStore.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from './authStore';
import { authService } from '../services/authService';

jest.mock('../services/authService');

describe('authStore', () => {
  it('should login user successfully', async () => {
    const mockUser = { id: 'user_123', nickname: '테스트' };
    const mockToken = 'jwt_token';
    
    (authService.login as jest.Mock).mockResolvedValue({
      user: mockUser,
      token: mockToken
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login('+821012345678', '123456');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### 2. 통합 테스트 (Integration Tests)

#### 2.1 API 통합 테스트

**테스트 도구**: Supertest, Jest

```typescript
// tests/integration/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';

describe('Auth API Integration', () => {
  beforeEach(async () => {
    // 테스트 데이터베이스 초기화
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          phoneNumber: '+821012345678',
          verificationCode: '123456',
          nickname: '새유저',
          birthYear: 1995,
          gender: 'MALE'
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            nickname: '새유저'
          },
          token: expect.any(String)
        }
      });

      // DB에 실제로 저장되었는지 확인
      const user = await prisma.user.findFirst({
        where: { nickname: '새유저' }
      });
      expect(user).toBeTruthy();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // 테스트 유저 생성
      await prisma.user.create({
        data: {
          phoneNumber: 'encrypted_phone',
          nickname: '기존유저',
          birthYear: 1990,
          gender: 'MALE'
        }
      });
    });

    it('should login existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phoneNumber: '+821012345678',
          verificationCode: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeTruthy();
    });
  });
});
```

#### 2.2 WebSocket 통합 테스트

```typescript
// tests/integration/chat.test.ts
import { io as ioClient, Socket } from 'socket.io-client';
import { server } from '../../src/server';
import { generateToken } from '../../src/utils/jwt';

describe('Chat WebSocket Integration', () => {
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  const serverUrl = 'http://localhost:3001';

  beforeAll((done) => {
    server.listen(3001, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach((done) => {
    // 두 개의 클라이언트 소켓 생성
    const token1 = generateToken({ userId: 'user_1' });
    const token2 = generateToken({ userId: 'user_2' });

    clientSocket1 = ioClient(serverUrl, {
      auth: { token: token1 }
    });

    clientSocket2 = ioClient(serverUrl, {
      auth: { token: token2 }
    });

    let connected = 0;
    const checkConnected = () => {
      connected++;
      if (connected === 2) done();
    };

    clientSocket1.on('connect', checkConnected);
    clientSocket2.on('connect', checkConnected);
  });

  afterEach(() => {
    clientSocket1.disconnect();
    clientSocket2.disconnect();
  });

  it('should exchange messages between matched users', (done) => {
    const chatRoomId = 'chat_123';
    const testMessage = '안녕하세요!';

    // 두 클라이언트 모두 채팅방 입장
    clientSocket1.emit('join-room', chatRoomId);
    clientSocket2.emit('join-room', chatRoomId);

    // 클라이언트2가 메시지 수신 대기
    clientSocket2.on('new-message', (message) => {
      expect(message).toMatchObject({
        content: testMessage,
        fromUserId: 'user_1',
        chatRoomId
      });
      done();
    });

    // 클라이언트1이 메시지 전송
    setTimeout(() => {
      clientSocket1.emit('send-message', {
        chatRoomId,
        content: testMessage
      });
    }, 100);
  });
});
```

### 3. E2E 테스트 (End-to-End Tests)

#### 3.1 Playwright E2E 테스트

**설정 파일** (`tests/e2e/playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 }
      }
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        browserName: 'webkit'
      }
    }
  ],

  webServer: {
    command: 'npm run dev',
    port: 8081,
    reuseExistingServer: !process.env.CI
  }
});
```

**E2E 테스트 시나리오**:
```typescript
// tests/e2e/matching-flow.spec.ts
import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from './helpers';

test.describe('매칭 플로우', () => {
  let user1Phone = '+821011111111';
  let user2Phone = '+821022222222';

  test.beforeEach(async () => {
    // 테스트 유저 설정
    await setupTestUser(user1Phone, '유저1');
    await setupTestUser(user2Phone, '유저2');
  });

  test.afterEach(async () => {
    await cleanupTestData([user1Phone, user2Phone]);
  });

  test('상호 좋아요 시 매칭 생성', async ({ page }) => {
    // 유저1 로그인
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', user1Phone);
    await page.fill('[data-testid="code-input"]', '123456');
    await page.click('[data-testid="login-button"]');

    // 그룹 가입
    await page.goto('/groups');
    await page.click('[data-testid="group-card-company"]');
    await page.click('[data-testid="join-group-button"]');

    // 유저2 프로필에 좋아요 보내기
    await page.goto('/groups/company/members');
    await page.click('[data-testid="member-card-user2"]');
    await page.click('[data-testid="like-button"]');
    
    await expect(page.locator('[data-testid="like-sent-toast"]')).toBeVisible();

    // 로그아웃
    await page.goto('/profile');
    await page.click('[data-testid="logout-button"]');

    // 유저2로 로그인
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', user2Phone);
    await page.fill('[data-testid="code-input"]', '123456');
    await page.click('[data-testid="login-button"]');

    // 받은 좋아요 확인
    await page.goto('/likes/received');
    await expect(page.locator('[data-testid="like-from-anonymous"]')).toBeVisible();

    // 좋아요 수락 (상호 좋아요)
    await page.click('[data-testid="accept-like-button"]');

    // 매칭 생성 확인
    await page.goto('/matches');
    await expect(page.locator('[data-testid="match-with-user1"]')).toBeVisible();

    // 채팅 시작
    await page.click('[data-testid="start-chat-button"]');
    await page.fill('[data-testid="message-input"]', '안녕하세요!');
    await page.click('[data-testid="send-message-button"]');

    await expect(page.locator('[data-testid="message-sent"]')).toBeVisible();
  });
});
```

## 🎯 테스트 커버리지 목표

### 전체 커버리지 목표
- **전체**: 80% 이상
- **Statements**: 80% 이상
- **Branches**: 75% 이상
- **Functions**: 80% 이상
- **Lines**: 80% 이상

### 핵심 모듈별 목표
| 모듈 | 목표 커버리지 | 설명 |
|------|--------------|------|
| 인증 서비스 | 95% | 보안 핵심 |
| 매칭 로직 | 95% | 비즈니스 핵심 |
| 결제 처리 | 95% | 금전 관련 |
| 채팅 암호화 | 90% | 개인정보 보호 |
| UI 컴포넌트 | 70% | 사용자 경험 |

## 🔄 테스트 실행 명령어

### 로컬 개발 환경
```bash
# 전체 테스트 실행
npm test

# 감시 모드 (파일 변경 시 자동 실행)
npm run test:watch

# 커버리지 리포트 생성
npm run test:coverage

# 특정 파일/폴더만 테스트
npm test -- UserService.test.ts
npm test -- src/services

# 디버그 모드
npm run test:debug
```

### 개별 테스트 종류
```bash
# 단위 테스트만
npm run test:unit

# 통합 테스트만
npm run test:integration

# E2E 테스트
npm run test:e2e

# E2E 테스트 (UI 모드)
npm run test:e2e:ui
```

## 📋 테스트 작성 체크리스트

### 단위 테스트 체크리스트
- [ ] 함수/메서드의 정상 동작 테스트
- [ ] 엣지 케이스 처리 (null, undefined, 빈 배열 등)
- [ ] 에러 상황 테스트
- [ ] 비동기 동작 테스트
- [ ] Mock 객체 적절히 활용
- [ ] 테스트 격리 (독립적 실행 가능)

### 통합 테스트 체크리스트
- [ ] 실제 DB 연결 테스트 (테스트 DB)
- [ ] API 엔드포인트 전체 플로우
- [ ] 인증/인가 미들웨어 동작
- [ ] 에러 응답 형식 검증
- [ ] 트랜잭션 롤백 테스트

### E2E 테스트 체크리스트
- [ ] 실제 사용자 시나리오 반영
- [ ] 크로스 브라우저 테스트
- [ ] 모바일 뷰포트 테스트
- [ ] 네트워크 지연 상황 테스트
- [ ] 에러 복구 시나리오

## 🚨 테스트 작성 모범 사례

### 1. 테스트 명명 규칙
```typescript
// ✅ 좋은 예
it('should return user profile when valid userId is provided', async () => {});
it('should throw 404 error when user does not exist', async () => {});

// ❌ 나쁜 예
it('test user', async () => {});
it('works', async () => {});
```

### 2. AAA 패턴 사용
```typescript
it('should create match when mutual like exists', async () => {
  // Arrange (준비)
  const user1 = await createTestUser();
  const user2 = await createTestUser();
  await createLike(user1.id, user2.id);

  // Act (실행)
  const result = await createLike(user2.id, user1.id);

  // Assert (검증)
  expect(result.match).toBeDefined();
  expect(result.match.users).toContain(user1.id);
  expect(result.match.users).toContain(user2.id);
});
```

### 3. 테스트 데이터 팩토리
```typescript
// tests/factories/userFactory.ts
export const createTestUser = (overrides?: Partial<User>) => {
  return {
    id: `user_${Date.now()}`,
    nickname: '테스트유저',
    phoneNumber: '+821012345678',
    birthYear: 1995,
    gender: 'MALE',
    ...overrides
  };
};
```

### 4. 비동기 테스트 처리
```typescript
// ✅ async/await 사용
it('should send notification after match', async () => {
  const match = await createMatch();
  await expect(notificationService.send).toHaveBeenCalled();
});

// ❌ 콜백 사용 지양
it('should send notification', (done) => {
  createMatch().then(() => {
    expect(notificationService.send).toHaveBeenCalled();
    done();
  });
});
```

## 🔧 테스트 환경 설정

### 테스트 데이터베이스
```bash
# .env.test
DATABASE_URL="postgresql://postgres:password@localhost:5432/glimpse_test"
```

### Jest 설정 (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

## 🐛 디버깅 가이드

### VS Code 디버깅 설정
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "--watchAll=false",
    "${file}"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### 테스트 실패 시 대응
1. **에러 메시지 확인**: 정확한 실패 지점 파악
2. **console.log 활용**: 중간 값 확인
3. **단일 테스트 실행**: `it.only()` 사용
4. **디버거 활용**: 브레이크포인트 설정
5. **스냅샷 업데이트**: UI 변경 시 `npm test -- -u`

## 📈 CI/CD 통합

### GitHub Actions 설정
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/glimpse_test
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

## 🏆 테스트 문화

### 테스트 우선 개발 (TDD)
1. **Red**: 실패하는 테스트 먼저 작성
2. **Green**: 테스트를 통과하는 최소한의 코드 작성
3. **Refactor**: 코드 개선 (테스트는 계속 통과)

### 코드 리뷰 시 테스트 확인
- PR에는 반드시 테스트 포함
- 새 기능 = 새 테스트
- 버그 수정 = 재현 테스트 추가
- 커버리지 감소 시 정당한 이유 필요

### 테스트 유지보수
- 깨진 테스트 즉시 수정
- 느린 테스트 최적화
- 불안정한 테스트 개선
- 중복 테스트 제거