import crypto from 'crypto';
import twilio from 'twilio';
import axios from 'axios';
import { logger } from '../utils/logger';
import { cacheService } from './CacheService';
import { createError } from '../middleware/errorHandler';

interface VerificationCode {
  code: string;
  phoneNumber: string;
  expiresAt: Date;
  attempts: number;
}

interface SMSProvider {
  send(phoneNumber: string, message: string): Promise<void>;
}

// Twilio SMS Provider
class TwilioProvider implements SMSProvider {
  private client: twilio.Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      logger.warn('Twilio credentials not configured');
      throw new Error('Twilio configuration missing');
    }

    this.client = twilio(accountSid, authToken);
  }

  async send(phoneNumber: string, message: string): Promise<void> {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: this.formatPhoneNumber(phoneNumber)
      });

      logger.info(`SMS sent successfully via Twilio: ${result.sid}`);
    } catch (error) {
      logger.error('Twilio SMS error:', error);
      throw createError(500, 'SMS 전송에 실패했습니다');
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Convert Korean format to international
    // 010-1234-5678 -> +821012345678
    const cleaned = phoneNumber.replace(/-/g, '');
    if (cleaned.startsWith('010')) {
      return '+82' + cleaned.substring(1);
    }
    return phoneNumber;
  }
}

// Korean SMS Provider (Aligo API)
class AligoProvider implements SMSProvider {
  private readonly apiUrl = 'https://apis.aligo.in/send/';
  private readonly apiKey: string;
  private readonly userId: string;
  private readonly sender: string;

  constructor() {
    this.apiKey = process.env.ALIGO_API_KEY || '';
    this.userId = process.env.ALIGO_USER_ID || '';
    this.sender = process.env.ALIGO_SENDER || '';

    if (!this.apiKey || !this.userId) {
      logger.warn('Aligo credentials not configured');
      throw new Error('Aligo configuration missing');
    }
  }

  async send(phoneNumber: string, message: string): Promise<void> {
    try {
      const formData = new URLSearchParams({
        key: this.apiKey,
        user_id: this.userId,
        sender: this.sender,
        receiver: phoneNumber.replace(/-/g, ''),
        msg: message,
        msg_type: 'SMS',
        title: 'Glimpse 인증'
      });

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.result_code !== '1') {
        throw new Error(`Aligo error: ${response.data.message}`);
      }

      logger.info(`SMS sent successfully via Aligo: ${response.data.msg_id}`);
    } catch (error) {
      logger.error('Aligo SMS error:', error);
      throw createError(500, 'SMS 전송에 실패했습니다');
    }
  }
}

// NHN Toast SMS Provider
class ToastSMSProvider implements SMSProvider {
  private readonly apiUrl: string;
  private readonly appKey: string;
  private readonly secretKey: string;
  private readonly sendNo: string;

  constructor() {
    this.apiUrl = process.env.TOAST_SMS_API_URL || 'https://api-sms.cloud.toast.com';
    this.appKey = process.env.TOAST_APP_KEY || '';
    this.secretKey = process.env.TOAST_SECRET_KEY || '';
    this.sendNo = process.env.TOAST_SEND_NO || '';

    if (!this.appKey || !this.secretKey) {
      logger.warn('Toast SMS credentials not configured');
      throw new Error('Toast SMS configuration missing');
    }
  }

  async send(phoneNumber: string, message: string): Promise<void> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/sms/v3.0/appKeys/${this.appKey}/sender/sms`,
        {
          body: message,
          sendNo: this.sendNo,
          recipientList: [
            {
              recipientNo: phoneNumber.replace(/-/g, ''),
              countryCode: '82'
            }
          ]
        },
        {
          headers: {
            'X-Secret-Key': this.secretKey,
            'Content-Type': 'application/json;charset=UTF-8'
          }
        }
      );

      if (!response.data.header.isSuccessful) {
        throw new Error(`Toast SMS error: ${response.data.header.resultMessage}`);
      }

      logger.info(`SMS sent successfully via Toast: ${response.data.body.data.requestId}`);
    } catch (error) {
      logger.error('Toast SMS error:', error);
      throw createError(500, 'SMS 전송에 실패했습니다');
    }
  }
}

export class SMSService {
  private provider: SMSProvider;
  private readonly maxAttempts = 3;
  private readonly codeLength = 6;
  private readonly expiryMinutes = 5;
  private readonly resendCooldown = 60; // seconds

  constructor() {
    // Select provider based on configuration
    const smsProvider = process.env.SMS_PROVIDER || 'dev';

    switch (smsProvider) {
      case 'twilio':
        try {
          this.provider = new TwilioProvider();
        } catch {
          logger.warn('Falling back to development SMS mode');
          this.provider = this.createDevProvider();
        }
        break;
      case 'aligo':
        try {
          this.provider = new AligoProvider();
        } catch {
          logger.warn('Falling back to development SMS mode');
          this.provider = this.createDevProvider();
        }
        break;
      case 'toast':
        try {
          this.provider = new ToastSMSProvider();
        } catch {
          logger.warn('Falling back to development SMS mode');
          this.provider = this.createDevProvider();
        }
        break;
      default:
        this.provider = this.createDevProvider();
    }
  }

  private createDevProvider(): SMSProvider {
    return {
      async send(phoneNumber: string, message: string): Promise<void> {
        logger.info(`📱 [DEV SMS] To: ${phoneNumber}`);
        logger.info(`📱 [DEV SMS] Message: ${message}`);
      }
    };
  }

  async sendVerificationCode(phoneNumber: string): Promise<{ verificationId: string }> {
    // Check for recent send to prevent spam
    const recentKey = `sms:recent:${phoneNumber}`;
    const recentSend = await cacheService.get<number>(recentKey);
    
    if (recentSend) {
      const timeSinceLastSend = Date.now() - recentSend;
      if (timeSinceLastSend < this.resendCooldown * 1000) {
        const remainingTime = Math.ceil((this.resendCooldown * 1000 - timeSinceLastSend) / 1000);
        throw createError(429, `${remainingTime}초 후에 다시 시도해주세요`);
      }
    }

    // Generate verification code
    const code = this.generateCode();
    const verificationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    // Store verification data in cache
    const verificationData: VerificationCode = {
      code,
      phoneNumber,
      expiresAt,
      attempts: 0
    };

    await cacheService.set(
      `sms:verification:${verificationId}`,
      verificationData,
      { ttl: this.expiryMinutes * 60 }
    );

    // Mark recent send
    await cacheService.set(recentKey, Date.now(), { ttl: this.resendCooldown });

    // Send SMS
    const message = `[Glimpse] 인증번호는 ${code}입니다. ${this.expiryMinutes}분 이내에 입력해주세요.`;
    
    try {
      await this.provider.send(phoneNumber, message);
    } catch (error) {
      // Clean up on failure
      await cacheService.delete(`sms:verification:${verificationId}`);
      await cacheService.delete(recentKey);
      throw error;
    }

    return { verificationId };
  }

  async verifyCode(verificationId: string, code: string): Promise<boolean> {
    const key = `sms:verification:${verificationId}`;
    const verification = await cacheService.get<VerificationCode>(key);

    if (!verification) {
      throw createError(400, '유효하지 않은 인증 요청입니다');
    }

    if (new Date() > verification.expiresAt) {
      await cacheService.delete(key);
      throw createError(400, '인증번호가 만료되었습니다');
    }

    // Check attempts
    verification.attempts++;
    if (verification.attempts > this.maxAttempts) {
      await cacheService.delete(key);
      throw createError(400, '인증 시도 횟수를 초과했습니다');
    }

    // Update attempts
    await cacheService.set(key, verification, { 
      ttl: Math.floor((verification.expiresAt.getTime() - Date.now()) / 1000) 
    });

    if (verification.code !== code) {
      if (verification.attempts === this.maxAttempts) {
        await cacheService.delete(key);
        throw createError(400, '인증 시도 횟수를 초과했습니다');
      }
      throw createError(400, `잘못된 인증번호입니다. (${verification.attempts}/${this.maxAttempts})`);
    }

    // Success - clean up
    await cacheService.delete(key);
    return true;
  }

  async sendNotification(phoneNumber: string, message: string): Promise<void> {
    try {
      await this.provider.send(phoneNumber, message);
    } catch (error) {
      logger.error('Failed to send SMS notification:', error);
      // Don't throw - notifications shouldn't break the flow
    }
  }

  async sendMatchNotification(phoneNumber: string, matchedUserNickname: string): Promise<void> {
    const message = `[Glimpse] 축하합니다! ${matchedUserNickname}님과 매칭되었습니다. 앱에서 확인해주세요!`;
    await this.sendNotification(phoneNumber, message);
  }

  async sendPaymentConfirmation(phoneNumber: string, amount: number, itemName: string): Promise<void> {
    const message = `[Glimpse] ${itemName} 결제가 완료되었습니다. 금액: ${amount.toLocaleString()}원`;
    await this.sendNotification(phoneNumber, message);
  }

  private generateCode(): string {
    const min = Math.pow(10, this.codeLength - 1);
    const max = Math.pow(10, this.codeLength) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  // Admin function to check SMS balance (provider-specific)
  async checkBalance(): Promise<{ provider: string; balance?: number; status: string }> {
    const provider = process.env.SMS_PROVIDER || 'dev';
    
    if (provider === 'dev') {
      return { provider: 'development', status: 'unlimited' };
    }

    // Provider-specific balance check implementations would go here
    return { provider, status: 'check not implemented' };
  }
}

export const smsService = new SMSService();