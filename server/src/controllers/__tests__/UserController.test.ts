import request from 'supertest';
import express from 'express';
import { UserController } from '../UserController';
import { UserService } from '../../services/UserService';
import { authMiddleware } from '../../middleware/auth';
import { createMockUser } from '../../__tests__/setup';

// Mock dependencies
jest.mock('../../services/UserService');
jest.mock('../../middleware/auth');

describe('UserController', () => {
  let app: express.Application;
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Setup mocks
    mockUserService = new UserService() as jest.Mocked<UserService>;
    userController = new UserController();

    // Mock auth middleware to always pass
    (authMiddleware as jest.Mock).mockImplementation((req, res, next) => {
      req.user = { id: 'test-user-id', phoneNumber: '010-1234-5678' };
      next();
    });

    // Setup routes
    app.post('/users', authMiddleware, (req, res, next) => 
      userController.createUser(req, res, next)
    );
    app.get('/users/me', authMiddleware, (req, res, next) =>
      userController.getCurrentUser(req, res, next)
    );
    app.put('/users/me', authMiddleware, (req, res, next) =>
      userController.updateCurrentUser(req, res, next)
    );
    app.delete('/users/me', authMiddleware, (req, res, next) =>
      userController.deleteCurrentUser(req, res, next)
    );
    app.post('/users/me/credits', authMiddleware, (req, res, next) =>
      userController.purchaseCredits(req, res, next)
    );
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const userData = {
        nickname: 'TestUser',
        age: 25,
        gender: 'MALE',
      };

      const mockUser = createMockUser(userData);
      mockUserService.createUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        nickname: 'TestUser',
        age: 25,
        gender: 'MALE',
      });
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        clerkId: expect.any(String),
        phoneNumber: '010-1234-5678',
        ...userData,
      });
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        nickname: '',
        age: 17,
        gender: 'INVALID',
      };

      const response = await request(app)
        .post('/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle service errors', async () => {
      mockUserService.createUser.mockRejectedValue(
        new Error('이미 가입된 전화번호입니다.')
      );

      const response = await request(app)
        .post('/users')
        .send({
          nickname: 'TestUser',
          age: 25,
          gender: 'MALE',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('이미 가입된 전화번호입니다.');
    });
  });

  describe('GET /users/me', () => {
    it('should return current user', async () => {
      const mockUser = createMockUser();
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'test-user-id',
        nickname: 'TestUser',
      });
      expect(mockUserService.getUserById).toHaveBeenCalledWith('test-user-id');
    });

    it('should handle user not found', async () => {
      mockUserService.getUserById.mockRejectedValue(
        new Error('User not found')
      );

      const response = await request(app)
        .get('/users/me')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('PUT /users/me', () => {
    it('should update current user', async () => {
      const updateData = {
        nickname: 'UpdatedName',
        bio: 'New bio',
      };

      const mockUser = createMockUser(updateData);
      mockUserService.updateUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/users/me')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nickname).toBe('UpdatedName');
      expect(response.body.data.bio).toBe('New bio');
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        'test-user-id',
        updateData
      );
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put('/users/me')
        .send({ age: 150 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /users/me', () => {
    it('should delete current user', async () => {
      mockUserService.deleteUser.mockResolvedValue({ 
        message: '회원 탈퇴가 완료되었습니다.' 
      });

      const response = await request(app)
        .delete('/users/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('회원 탈퇴가 완료되었습니다.');
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('POST /users/me/credits', () => {
    it('should purchase credits', async () => {
      const purchaseData = { amount: 10 };
      const mockUser = createMockUser({ credits: 15 });
      
      mockUserService.purchaseCredits.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/me/credits')
        .send(purchaseData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.credits).toBe(15);
      expect(mockUserService.purchaseCredits).toHaveBeenCalledWith(
        'test-user-id',
        10
      );
    });

    it('should validate credit amount', async () => {
      const response = await request(app)
        .post('/users/me/credits')
        .send({ amount: -5 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('amount must be positive');
    });
  });
});