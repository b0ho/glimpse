import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Create mock prisma instance
export const prismaMock = mockDeep<PrismaClient>();

// Mock Prisma Client
jest.mock('../config/database', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.CLERK_SECRET_KEY = 'test-clerk-secret';
process.env.CLERK_PUBLISHABLE_KEY = 'test-clerk-publishable';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

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