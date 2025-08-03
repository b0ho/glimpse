import { SMSService } from '../../src/services/SMSService';
import { cacheService } from '../../src/services/CacheService';
import { createError } from '../../src/middleware/errorHandler';
import twilio from 'twilio';
import axios from 'axios';

// Mock dependencies
jest.mock('twilio');
jest.mock('axios');
jest.mock('../../src/services/CacheService');
jest.mock('../../src/middleware/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));
jest.mock('../../src/config/database', () => ({
  prisma: {
    sMSLog: {
      create: jest.fn(),
      groupBy: jest.fn()
    }
  }
}));

describe('SMSService', () => {
  let smsService: SMSService;
  const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.SMS_PROVIDER = 'dev';
    
    // Mock cache service methods
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue();
    mockCacheService.delete.mockResolvedValue();
  });

  describe('Development Mode', () => {
    beforeEach(() => {
      process.env.SMS_PROVIDER = 'dev';
      smsService = new SMSService();
    });

    test('should send verification code in dev mode', async () => {
      const phoneNumber = '010-1234-5678';
      const result = await smsService.sendVerificationCode(phoneNumber);
      
      expect(result).toHaveProperty('verificationId');
      expect(mockCacheService.set).toHaveBeenCalledTimes(2); // verification data + recent send marker
    });

    test('should verify code correctly', async () => {
      const verificationId = 'test-id';
      const code = '123456';
      
      mockCacheService.get.mockResolvedValueOnce({
        code,
        phoneNumber: '010-1234-5678',
        expiresAt: new Date(Date.now() + 300000), // 5 minutes from now
        attempts: 0
      });
      
      const result = await smsService.verifyCode(verificationId, code);
      expect(result).toBe(true);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`sms:verification:${verificationId}`);
    });

    test('should reject expired verification codes', async () => {
      const verificationId = 'test-id';
      const code = '123456';
      
      mockCacheService.get.mockResolvedValueOnce({
        code,
        phoneNumber: '010-1234-5678',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago (expired)
        attempts: 0
      });
      
      await expect(smsService.verifyCode(verificationId, code))
        .rejects.toThrow('인증번호가 만료되었습니다');
    });

    test('should enforce resend cooldown', async () => {
      const phoneNumber = '010-1234-5678';
      
      // Mock recent send
      mockCacheService.get.mockResolvedValueOnce(Date.now() - 30000); // 30 seconds ago
      
      await expect(smsService.sendVerificationCode(phoneNumber))
        .rejects.toThrow(/초 후에 다시 시도해주세요/);
    });

    test('should limit verification attempts', async () => {
      const verificationId = 'test-id';
      const wrongCode = '000000';
      const correctCode = '123456';
      
      // Set up verification data with 2 attempts already made
      const verificationData = {
        code: correctCode,
        phoneNumber: '010-1234-5678',
        expiresAt: new Date(Date.now() + 300000),
        attempts: 2
      };
      
      mockCacheService.get.mockResolvedValue(verificationData);
      
      // Third attempt with wrong code should fail and delete the verification
      await expect(smsService.verifyCode(verificationId, wrongCode))
        .rejects.toThrow('인증 시도 횟수를 초과했습니다');
      
      expect(mockCacheService.delete).toHaveBeenCalledWith(`sms:verification:${verificationId}`);
    });
  });

  describe('Twilio Provider', () => {
    let mockTwilioClient: any;
    
    beforeEach(() => {
      process.env.SMS_PROVIDER = 'twilio';
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';
      
      mockTwilioClient = {
        messages: {
          create: jest.fn().mockResolvedValue({ sid: 'test-message-sid' })
        }
      };
      
      (twilio as unknown as jest.Mock).mockReturnValue(mockTwilioClient);
      
      smsService = new SMSService();
    });

    test('should send SMS via Twilio', async () => {
      const phoneNumber = '010-1234-5678';
      const result = await smsService.sendVerificationCode(phoneNumber);
      
      expect(result).toHaveProperty('verificationId');
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('[Glimpse] 인증번호는'),
        from: '+1234567890',
        to: '+821012345678' // Korean number formatted
      });
    });

    test('should handle Twilio send failure', async () => {
      mockTwilioClient.messages.create.mockRejectedValueOnce(new Error('Twilio error'));
      
      const phoneNumber = '010-1234-5678';
      await expect(smsService.sendVerificationCode(phoneNumber))
        .rejects.toThrow('SMS 전송에 실패했습니다');
    });
  });

  describe('Provider Failover', () => {
    beforeEach(() => {
      // Set up multiple providers
      process.env.SMS_PROVIDER = 'twilio';
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';
      
      process.env.ALIGO_API_KEY = 'test-key';
      process.env.ALIGO_USER_ID = 'test-user';
      process.env.ALIGO_SENDER = '18001234';
    });

    test('should failover to another provider on repeated failures', async () => {
      const mockTwilioClient = {
        messages: {
          create: jest.fn().mockRejectedValue(new Error('Twilio error'))
        }
      };
      
      (twilio as unknown as jest.Mock).mockReturnValue(mockTwilioClient);
      (axios.post as jest.Mock).mockResolvedValue({
        data: { result_code: '1', msg_id: 'test-msg-id' }
      });
      
      smsService = new SMSService();
      
      // Send multiple messages to trigger failover
      for (let i = 0; i < 3; i++) {
        try {
          await smsService.sendVerificationCode(`010-1234-567${i}`);
        } catch {}
      }
      
      // After 3 failures, should switch to Aligo
      await smsService.sendVerificationCode('010-1234-5679');
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://apis.aligo.in/send/',
        expect.any(URLSearchParams),
        expect.any(Object)
      );
    });
  });

  describe('Admin Functions', () => {
    beforeEach(() => {
      smsService = new SMSService();
    });

    test('should check balance for dev provider', async () => {
      const balance = await smsService.checkBalance();
      
      expect(balance).toEqual({
        provider: 'development',
        status: 'unlimited',
        failureStats: {
          current: 0,
          allProviders: {}
        }
      });
    });

    test('should return SMS statistics', async () => {
      const { prisma } = require('../../src/config/database');
      prisma.sMSLog.groupBy.mockResolvedValue([]);
      
      const stats = await smsService.getStatistics(7);
      
      expect(stats).toHaveProperty('summary');
      expect(stats).toHaveProperty('daily');
      expect(stats).toHaveProperty('period', '7 days');
      expect(stats).toHaveProperty('providers');
    });
  });
});