import request from 'supertest';
import express from 'express';
import { authController } from '../controllers/AuthController';
import { authService } from '../services/AuthService';
import { smsService } from '../services/SMSService';
import { prisma } from '../config/database';
import { createMockUser } from './setup';
import { errorHandler } from '../middleware/errorHandler';

// Mock services
jest.mock('../services/AuthService');
jest.mock('../services/SMSService');

const app = express();
app.use(express.json());

// Mount auth routes for testing
app.post('/auth/send-sms', authController.sendSMS);
app.post('/auth/verify-sms', authController.verifySMS);
app.post('/auth/register', authController.register);

// Add error handler
app.use(errorHandler);

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/send-sms', () => {
    it('should send verification code for valid phone number', async () => {
      const phoneNumber = '010-1234-5678';
      
      (smsService.sendVerificationCode as jest.Mock).mockResolvedValue({
        verificationId: 'verify-123',
      });

      const response = await request(app)
        .post('/auth/send-sms')
        .send({ phoneNumber })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          message: '인증 코드가 전송되었습니다.',
          verificationId: 'verify-123'
        }
      });
      expect(smsService.sendVerificationCode).toHaveBeenCalledWith(phoneNumber);
    });

    it('should reject invalid phone number format', async () => {
      const response = await request(app)
        .post('/auth/send-sms')
        .send({ phoneNumber: 'invalid-phone' })
        .expect(400);

      expect(response.body.error.message).toBe('올바른 전화번호 형식이 아닙니다.');
      expect(smsService.sendVerificationCode).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/verify-sms', () => {
    const phoneNumber = '010-1234-5678';
    const verificationCode = '123456';
    const verificationId = 'verify-123';

    it('should verify code and return token for existing user', async () => {
      const mockUser = createMockUser({ phoneNumber });
      
      (smsService.verifyCode as jest.Mock).mockResolvedValue(true);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (authService.generateToken as jest.Mock).mockReturnValue('mock-token');

      const response = await request(app)
        .post('/auth/verify-sms')
        .send({ phoneNumber, verificationCode, verificationId });
      
      if (response.status !== 200) {
        console.log('Error response:', response.body);
      }
      
      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          token: 'mock-token',
          user: expect.objectContaining({
            id: mockUser.id,
            phoneNumber: mockUser.phoneNumber,
          }),
        }),
      });
    });

    it('should reject invalid verification code', async () => {
      (smsService.verifyCode as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/verify-sms')
        .send({ phoneNumber, verificationCode, verificationId })
        .expect(400);

      expect(response.body.error.message).toBe('인증 코드가 올바르지 않습니다.');
    });
  });

  describe('POST /auth/register', () => {
    const registerData = {
      phoneNumber: '010-1234-5678',
      nickname: 'TestUser',
      age: 25,
      gender: 'MALE',
      bio: 'Hello world',
    };

    it('should update user profile after phone verification', async () => {
      const verifiedUser = createMockUser({ 
        phoneNumber: registerData.phoneNumber,
        isVerified: true,
        nickname: '임시사용자'
      });
      const updatedUser = createMockUser(registerData);
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(verifiedUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (authService.generateToken as jest.Mock).mockReturnValue('mock-token');

      const response = await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          token: 'mock-token',
          user: expect.objectContaining({
            id: updatedUser.id,
            nickname: updatedUser.nickname,
          }),
        }),
      });
    });

    it('should reject unverified phone number', async () => {
      const unverifiedUser = createMockUser({ 
        phoneNumber: registerData.phoneNumber,
        isVerified: false
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(unverifiedUser);

      const response = await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.error.message).toBe('전화번호 인증이 필요합니다.');
    });
  });
});