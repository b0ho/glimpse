import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Create mock prisma instance
export const prismaMock = mockDeep<PrismaClient>();

// Mock Prisma Client
jest.mock('../config/database', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

// Mock index.ts to prevent server startup
jest.mock('../index', () => ({
  __esModule: true,
  app: {},
  io: {
    to: jest.fn().mockReturnValue({ emit: jest.fn() })
  }
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = '12345678901234567890123456789012'; // 32+ characters
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // Exactly 32 characters
process.env.CLERK_SECRET_KEY = 'test-clerk-secret';
process.env.CLERK_PUBLISHABLE_KEY = 'test-clerk-publishable';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.FRONTEND_URL = 'http://localhost:8081';
process.env.STRIPE_SECRET_KEY = 'sk_test_1234567890';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test1234567890';
process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
process.env.AWS_ACCESS_KEY_ID = 'test-aws-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.FCM_PROJECT_ID = 'test-fcm-project';
process.env.FCM_CLIENT_EMAIL = 'test@test.com';
process.env.FCM_PRIVATE_KEY = 'test-private-key';
process.env.KAKAO_API_KEY = 'test-kakao-key';
process.env.KAKAO_MAP_API_KEY = 'test-kakao-map-key';
process.env.TOSS_SECRET_KEY = 'test-toss-key';
process.env.KAKAOPAY_ADMIN_KEY = 'test-kakaopay-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.NAVER_CLIENT_ID = 'test-naver-id';
process.env.NAVER_CLIENT_SECRET = 'test-naver-secret';
process.env.GOOGLE_VISION_API_KEY = 'test-google-vision-key';

// Mock external services
jest.mock('../services/FirebaseService');
jest.mock('../services/EmailService');
jest.mock('../services/SMSService');
jest.mock('../services/FileUploadService');

// Keep console logs for debugging
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
//   debug: jest.fn(),
// };

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  clerkId: 'clerk-test-id',
  anonymousId: 'anon-test-id',
  phoneNumber: '010-1234-5678',
  nickname: 'TestUser',
  age: 25,
  gender: 'MALE',
  bio: 'Test bio',
  profileImage: null,
  isVerified: true,
  credits: 5,
  isPremium: false,
  premiumUntil: null,
  lastActive: new Date(),
  lastOnline: new Date(),
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockGroup = (overrides = {}) => ({
  id: 'test-group-id',
  name: 'Test Group',
  description: 'Test group description',
  type: 'CREATED',
  isActive: true,
  memberCount: 10,
  maxMembers: 100,
  creatorId: 'test-user-id',
  companyId: null,
  location: null,
  settings: {
    requiresApproval: false,
    allowInvites: true,
    isPrivate: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockMatch = (overrides = {}) => ({
  id: 'test-match-id',
  user1Id: 'test-user-1',
  user2Id: 'test-user-2',
  groupId: 'test-group-id',
  isActive: true,
  lastMessageAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockMessage = (overrides = {}) => ({
  id: 'test-message-id',
  matchId: 'test-match-id',
  senderId: 'test-user-id',
  content: 'Test message',
  type: 'TEXT',
  isEncrypted: true,
  readAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});