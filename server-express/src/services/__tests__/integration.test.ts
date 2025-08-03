import { EmailService } from '../EmailService';
import { SMSService } from '../SMSService';
import { cacheService } from '../CacheService';
import { paymentRetryManager, idempotencyManager, paymentCircuitBreaker } from '../../utils/paymentRetry';

// Mock all external dependencies
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
    isReady: false
  }))
}));
jest.mock('nodemailer');
jest.mock('@sendgrid/mail');
jest.mock('@aws-sdk/client-ses');
jest.mock('twilio');
jest.mock('axios');
jest.mock('../../config/database');
jest.mock('../../utils/logger');

describe('Service Integration Tests', () => {
  describe('EmailService', () => {
    it('should create instance and send email in dev mode', async () => {
      process.env.EMAIL_PROVIDER = 'dev';
      const emailService = EmailService.getInstance();
      
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });
      
      expect(result).toBe(true);
    });

    it('should handle health check', async () => {
      const emailService = EmailService.getInstance();
      const health = await emailService.checkHealth();
      
      expect(health).toHaveProperty('provider');
      expect(health).toHaveProperty('healthy');
    });
  });

  describe('SMSService', () => {
    it('should create instance in dev mode', () => {
      process.env.SMS_PROVIDER = 'dev';
      const smsService = new SMSService();
      
      expect(smsService).toBeDefined();
    });

    it('should send verification code in dev mode', async () => {
      process.env.SMS_PROVIDER = 'dev';
      const smsService = new SMSService();
      
      // Mock cache methods
      (cacheService.get as jest.Mock) = jest.fn().mockResolvedValue(null);
      (cacheService.set as jest.Mock) = jest.fn().mockResolvedValue(undefined);
      
      const result = await smsService.sendVerificationCode('010-1234-5678');
      
      expect(result).toHaveProperty('verificationId');
      expect(typeof result.verificationId).toBe('string');
    });
  });

  describe('PaymentRetryManager', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset timers
      jest.useRealTimers();
    });

    it('should execute function successfully', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await paymentRetryManager.executeWithRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('IdempotencyManager', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (cacheService.get as jest.Mock) = jest.fn();
      (cacheService.set as jest.Mock) = jest.fn();
      (cacheService.delete as jest.Mock) = jest.fn();
    });

    it('should check and set idempotency key', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      const result = await idempotencyManager.checkAndSet('test-key', { data: 'test' });
      
      expect(result).toBe(true);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('PaymentCircuitBreaker', () => {
    it('should execute function when circuit is closed', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await paymentCircuitBreaker.execute('test-provider', mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should track circuit state', () => {
      const state = paymentCircuitBreaker.getState('test-provider');
      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(state);
    });
  });

  describe('CacheService', () => {
    it('should handle operations gracefully when Redis is not available', async () => {
      // Get should return null
      const getValue = await cacheService.get('test-key');
      expect(getValue).toBeNull();
      
      // Set should not throw
      await expect(cacheService.set('test-key', 'value')).resolves.not.toThrow();
      
      // Delete should return false
      const deleteResult = await cacheService.delete('test-key');
      expect(deleteResult).toBe(false);
    });
  });
});