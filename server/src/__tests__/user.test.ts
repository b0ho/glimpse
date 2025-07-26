import request from 'supertest';
import express from 'express';
import { userController } from '../controllers/UserController';
import { userService } from '../services/UserService';
import { fileUploadService } from '../services/FileUploadService';
import { prisma } from '../config/database';
import { createMockUser } from './setup';

// Mock services
jest.mock('../services/UserService');
jest.mock('../services/FileUploadService');

// Mock auth middleware
const mockAuth = (req: any, res: any, next: any) => {
  req.auth = { userId: 'test-user-id' };
  next();
};

const app = express();
app.use(express.json());

// Mount user routes with mocked auth
app.get('/users/me', mockAuth, userController.getCurrentUser);
app.put('/users/profile', mockAuth, userController.updateProfile);
app.get('/users/:userId', mockAuth, userController.getUserById);
app.post('/users/verify/company', mockAuth, userController.verifyCompany);
app.delete('/users', mockAuth, userController.deleteAccount);

describe('User API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users/me', () => {
    it('should return current user profile', async () => {
      const mockUser = createMockUser();
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/me')
        .expect(200);

      expect(response.body).toEqual({
        id: mockUser.id,
        anonymousId: mockUser.anonymousId,
        phoneNumber: mockUser.phoneNumber,
        nickname: mockUser.nickname,
        age: mockUser.age,
        gender: mockUser.gender,
        bio: mockUser.bio,
        profileImage: mockUser.profileImage,
        isVerified: mockUser.isVerified,
        credits: mockUser.credits,
        isPremium: mockUser.isPremium,
        premiumUntil: mockUser.premiumUntil,
        lastActive: mockUser.lastActive.toISOString(),
        createdAt: mockUser.createdAt.toISOString(),
      });
    });

    it('should return 404 when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/users/me')
        .expect(404);

      expect(response.body.error).toBe('사용자를 찾을 수 없습니다');
    });
  });

  describe('PUT /users/profile', () => {
    const updateData = {
      nickname: 'UpdatedUser',
      age: 30,
      bio: 'Updated bio',
    };

    it('should update user profile successfully', async () => {
      const mockUser = createMockUser();
      const updatedUser = { ...mockUser, ...updateData };
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (userService.updateProfile as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/users/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.nickname).toBe(updateData.nickname);
      expect(response.body.age).toBe(updateData.age);
      expect(response.body.bio).toBe(updateData.bio);
    });

    it('should validate nickname format', async () => {
      const response = await request(app)
        .put('/users/profile')
        .send({ nickname: 'a' }) // Too short
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate age range', async () => {
      const response = await request(app)
        .put('/users/profile')
        .send({ age: 15 }) // Too young
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /users/:userId', () => {
    it('should return anonymous user info when not matched', async () => {
      const mockUser = createMockUser();
      const targetUser = createMockUser({
        id: 'target-user-id',
        nickname: 'TargetUser',
      });
      
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // Current user
        .mockResolvedValueOnce(targetUser); // Target user
      
      (prisma.match.findFirst as jest.Mock).mockResolvedValue(null); // No match

      const response = await request(app)
        .get('/users/target-user-id')
        .expect(200);

      expect(response.body).toEqual({
        anonymousId: targetUser.anonymousId,
        gender: targetUser.gender,
        age: targetUser.age,
        bio: targetUser.bio,
        isMatched: false,
      });
      expect(response.body.nickname).toBeUndefined();
    });

    it('should return full user info when matched', async () => {
      const mockUser = createMockUser();
      const targetUser = createMockUser({
        id: 'target-user-id',
        nickname: 'TargetUser',
      });
      
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(targetUser);
      
      (prisma.match.findFirst as jest.Mock).mockResolvedValue({
        id: 'match-id',
        user1Id: mockUser.id,
        user2Id: targetUser.id,
      });

      const response = await request(app)
        .get('/users/target-user-id')
        .expect(200);

      expect(response.body.nickname).toBe(targetUser.nickname);
      expect(response.body.isMatched).toBe(true);
    });
  });

  describe('POST /users/verify/company', () => {
    const verificationData = {
      companyId: 'company-id',
      method: 'EMAIL_DOMAIN',
      email: 'user@company.com',
    };

    it('should submit company verification successfully', async () => {
      const mockUser = createMockUser();
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({
        id: 'company-id',
        name: 'Test Company',
        domain: 'company.com',
      });
      (prisma.companyVerification.create as jest.Mock).mockResolvedValue({
        id: 'verification-id',
        status: 'PENDING',
      });

      const response = await request(app)
        .post('/users/verify/company')
        .send(verificationData)
        .expect(200);

      expect(response.body).toEqual({
        message: '회사 인증 요청이 제출되었습니다',
        verificationId: 'verification-id',
      });
    });

    it('should reject invalid company', async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/users/verify/company')
        .send(verificationData)
        .expect(404);

      expect(response.body.error).toBe('회사를 찾을 수 없습니다');
    });
  });

  describe('DELETE /users', () => {
    it('should delete user account successfully', async () => {
      const mockUser = createMockUser();
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (userService.deleteAccount as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete('/users')
        .send({ reason: '더 이상 사용하지 않음' })
        .expect(204);

      expect(response.body).toEqual({});
      expect(userService.deleteAccount).toHaveBeenCalledWith(
        mockUser.id,
        '더 이상 사용하지 않음'
      );
    });

    it('should require deletion reason', async () => {
      const response = await request(app)
        .delete('/users')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});