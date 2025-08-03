import request from 'supertest';
import express from 'express';
import { userController } from '../controllers/UserController';
import { prisma } from '../config/database';
import { createMockUser } from './setup';
import { errorHandler } from '../middleware/errorHandler';

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

// Add error handler
app.use(errorHandler);

describe('User API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users/me', () => {
    it('should return current user profile', async () => {
      const mockUser = createMockUser();
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        groupMemberships: []
      });

      const response = await request(app)
        .get('/users/me')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          id: mockUser.id,
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
          groups: []
        }
      });
    });

    it('should return 404 when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/users/me')
        .expect(404);

      expect(response.body.error.message).toBe('사용자를 찾을 수 없습니다.');
    });
  });

  describe('PUT /users/profile', () => {
    const updateData = {
      nickname: 'updated',
      age: 30,
      bio: 'Updated bio',
    };

    it('should update user profile successfully', async () => {
      const mockUser = createMockUser();
      const updatedUser = { ...mockUser, ...updateData };
      
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/users/profile')
        .send(updateData);

      // 실제 응답 확인
      if (response.status !== 200) {
        console.log('Update profile error:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          nickname: updateData.nickname,
          age: updateData.age,
          bio: updateData.bio
        })
      });
    });

    it('should validate nickname format', async () => {
      const response = await request(app)
        .put('/users/profile')
        .send({ nickname: 'a' }) // Too short
        .expect(400);

      expect(response.body.error.message).toBeDefined();
    });

    it('should validate age range', async () => {
      const response = await request(app)
        .put('/users/profile')
        .send({ age: 15 }) // Too young
        .expect(400);

      expect(response.body.error.message).toBeDefined();
    });
  });

  describe('GET /users/:userId', () => {
    it('should return limited user info when users cannot view details', async () => {
      const mockUser = createMockUser();
      const targetUser = createMockUser({
        id: 'target-user-id',
        nickname: 'TargetUser',
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(targetUser);
      
      // Mock canViewUserDetails to return false
      const userService = require('../services/UserService').userService;
      jest.spyOn(userService, 'canViewUserDetails').mockResolvedValue(false);

      const response = await request(app)
        .get('/users/target-user-id')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          id: targetUser.id,
          nickname: targetUser.nickname.charAt(0) + '*'.repeat(targetUser.nickname.length - 1),
          age: targetUser.age,
          gender: targetUser.gender
        }
      });
    });

    it('should return full user info when users can view details', async () => {
      const mockUser = createMockUser();
      const targetUser = createMockUser({
        id: 'target-user-id',
        nickname: 'TargetUser',
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(targetUser);
      
      // Mock canViewUserDetails to return true
      const userService = require('../services/UserService').userService;
      jest.spyOn(userService, 'canViewUserDetails').mockResolvedValue(true);

      const response = await request(app)
        .get('/users/target-user-id')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: targetUser.id,
          nickname: targetUser.nickname,
          age: targetUser.age,
          gender: targetUser.gender,
          profileImage: targetUser.profileImage,
          bio: targetUser.bio,
          lastActive: targetUser.lastActive.toISOString()
        })
      });
    });
  });

  describe('POST /users/verify/company', () => {
    const verificationData = {
      companyId: 'company-id',
      method: 'EMAIL_DOMAIN',
      data: {
        email: 'user@company.com'
      }
    };

    it('should submit company verification successfully', async () => {
      const mockUser = createMockUser();
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/verify/company')
        .send(verificationData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          message: '회사 인증 요청이 접수되었습니다.',
          verificationId: 'temp-id'
        }
      });
    });
  });

  describe('DELETE /users', () => {
    it('should delete user account successfully', async () => {
      const mockUser = createMockUser();
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        phoneNumber: `deleted_${Date.now()}`,
        nickname: 'deleted_user',
        profileImage: null,
        bio: null,
        isVerified: false,
        credits: 0,
        isPremium: false,
        premiumUntil: null
      });

      const response = await request(app)
        .delete('/users')
        .send({ confirmPhoneNumber: mockUser.phoneNumber })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { message: '계정이 삭제되었습니다.' }
      });
    });

    it('should require correct phone number confirmation', async () => {
      const mockUser = createMockUser();
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .delete('/users')
        .send({ confirmPhoneNumber: '+82101111111' }) // Wrong number
        .expect(400);

      expect(response.body.error.message).toBe('전화번호 확인이 일치하지 않습니다.');
    });
  });
});