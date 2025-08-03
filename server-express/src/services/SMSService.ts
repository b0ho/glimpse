import crypto from 'crypto';
import twilio from 'twilio';
import axios from 'axios';
import { logger } from '../middleware/logging';
import { cacheService } from './CacheService';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { metrics } from '../utils/monitoring';

/**
 * 인증 코드 인터페이스
 * @interface VerificationCode
 */
interface VerificationCode {
  /** 인증 코드 */
  code: string;
  /** 휴대폰 번호 */
  phoneNumber: string;
  /** 만료 시간 */
  expiresAt: Date;
  /** 시도 횟수 */
  attempts: number;
}

/**
 * SMS 제공자 인터페이스
 * @interface SMSProvider
 */
interface SMSProvider {
  /**
   * SMS 전송
   * @param {string} phoneNumber - 휴대폰 번호
   * @param {string} message - 메시지 내용
   * @returns {Promise<void>}
   */
  send(phoneNumber: string, message: string): Promise<void>;
}

/**
 * Twilio SMS 제공자 구현
 * @class TwilioProvider
 * @implements {SMSProvider}
 */
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
      
      // Track SMS metrics
      metrics.smsMessagesSentTotal?.labels('twilio', 'success').inc();
    } catch (error) {
      logger.error('Twilio SMS error:', error);
      metrics.smsMessagesSentTotal?.labels('twilio', 'failed').inc();
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

/**
 * 한국 SMS 제공자 (Aligo API) 구현
 * @class AligoProvider
 * @implements {SMSProvider}
 */
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
      metrics.smsMessagesSentTotal?.labels('aligo', 'success').inc();
    } catch (error) {
      logger.error('Aligo SMS error:', error);
      metrics.smsMessagesSentTotal?.labels('aligo', 'failed').inc();
      throw createError(500, 'SMS 전송에 실패했습니다');
    }
  }
}

/**
 * NHN Toast SMS 제공자 구현
 * @class ToastSMSProvider
 * @implements {SMSProvider}
 */
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
      metrics.smsMessagesSentTotal?.labels('toast', 'success').inc();
    } catch (error) {
      logger.error('Toast SMS error:', error);
      metrics.smsMessagesSentTotal?.labels('toast', 'failed').inc();
      throw createError(500, 'SMS 전송에 실패했습니다');
    }
  }
}

/**
 * SMS 서비스 - 인증 코드 및 알림 전송 관리
 * @class SMSService
 */
export class SMSService {
  /** SMS 제공자 */
  private provider: SMSProvider;
  /** 최대 인증 시도 횟수 */
  private readonly maxAttempts = 3;
  /** 인증 코드 길이 */
  private readonly codeLength = 6;
  /** 인증 코드 만료 시간 (분) */
  private readonly expiryMinutes = 5;
  /** 재전송 쿨다운 (초) */
  private readonly resendCooldown = 60; // seconds
  /** 제공자별 실패 횟수 */
  private failureCount: Map<string, number> = new Map();
  /** 마지막 실패 시간 */
  private lastFailureTime: Map<string, number> = new Map();
  /** 전환 전 최대 실패 횟수 */
  private readonly maxFailuresBeforeSwitch = 3;
  /** 실패 초기화 시간 */
  private readonly failureResetTime = 300000; // 5 minutes

  /**
   * SMSService 생성자
   */
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

  /**
   * 개발용 SMS 제공자 생성
   * @private
   * @returns {SMSProvider} 개발용 제공자
   */
  private createDevProvider(): SMSProvider {
    return {
      async send(phoneNumber: string, message: string): Promise<void> {
        logger.info(`📱 [DEV SMS] To: ${phoneNumber}`);
        logger.info(`📱 [DEV SMS] Message: ${message}`);
      }
    };
  }

  /**
   * 인증 코드 전송
   * @param {string} phoneNumber - 휴대폰 번호
   * @returns {Promise<{ verificationId: string }>} 인증 ID
   * @throws {Error} 쿨다운 중이거나 전송 실패 시
   */
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

    // Send SMS with retry mechanism
    const message = `[Glimpse] 인증번호는 ${code}입니다. ${this.expiryMinutes}분 이내에 입력해주세요.`;
    
    try {
      await this.sendWithRetry(phoneNumber, message);
      
      // Log SMS activity to database
      await prisma.sMSLog?.create({
        data: {
          phoneNumber,
          messageType: 'verification',
          provider: process.env.SMS_PROVIDER || 'dev',
          status: 'sent',
          message: message.substring(0, 100), // Truncate for privacy
          metadata: {
            verificationId,
            expiresAt: expiresAt.toISOString()
          }
        }
      }).catch(err => {
        logger.error('Failed to log SMS activity:', err);
      });
    } catch (error) {
      // Clean up on failure
      await cacheService.delete(`sms:verification:${verificationId}`);
      await cacheService.delete(recentKey);
      
      // Log failure
      await prisma.sMSLog?.create({
        data: {
          phoneNumber,
          messageType: 'verification',
          provider: process.env.SMS_PROVIDER || 'dev',
          status: 'failed',
          message: message.substring(0, 100),
          metadata: {
            error: (error as Error).message
          }
        }
      }).catch(err => {
        logger.error('Failed to log SMS failure:', err);
      });
      
      throw error;
    }

    return { verificationId };
  }

  /**
   * 인증 코드 검증
   * @param {string} verificationId - 인증 ID
   * @param {string} code - 입력한 인증 코드
   * @returns {Promise<boolean>} 인증 성공 여부
   * @throws {Error} 유효하지 않은 요청, 만료, 최대 시도 초과, 잘못된 코드
   */
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

  /**
   * 알림 SMS 전송
   * @param {string} phoneNumber - 휴대폰 번호
   * @param {string} message - 메시지 내용
   * @returns {Promise<void>}
   */
  async sendNotification(phoneNumber: string, message: string): Promise<void> {
    try {
      await this.provider.send(phoneNumber, message);
    } catch (error) {
      logger.error('Failed to send SMS notification:', error);
      // Don't throw - notifications shouldn't break the flow
    }
  }

  /**
   * 매칭 알림 전송
   * @param {string} phoneNumber - 휴대폰 번호
   * @param {string} matchedUserNickname - 매칭된 사용자 닉네임
   * @returns {Promise<void>}
   */
  async sendMatchNotification(phoneNumber: string, matchedUserNickname: string): Promise<void> {
    const message = `[Glimpse] 축하합니다! ${matchedUserNickname}님과 매칭되었습니다. 앱에서 확인해주세요!`;
    await this.sendNotification(phoneNumber, message);
  }

  /**
   * 결제 확인 SMS 전송
   * @param {string} phoneNumber - 휴대폰 번호
   * @param {number} amount - 결제 금액
   * @param {string} itemName - 상품명
   * @returns {Promise<void>}
   */
  async sendPaymentConfirmation(phoneNumber: string, amount: number, itemName: string): Promise<void> {
    const message = `[Glimpse] ${itemName} 결제가 완료되었습니다. 금액: ${amount.toLocaleString()}원`;
    await this.sendNotification(phoneNumber, message);
  }

  /**
   * 인증 코드 생성
   * @private
   * @returns {string} 생성된 인증 코드
   */
  private generateCode(): string {
    const min = Math.pow(10, this.codeLength - 1);
    const max = Math.pow(10, this.codeLength) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * 재시도 및 펴오버 메커니즘으로 SMS 전송
   * @private
   * @param {string} phoneNumber - 휴대폰 번호
   * @param {string} message - 메시지 내용
   * @param {number} [retries=2] - 재시도 횟수
   * @returns {Promise<void>}
   * @throws {Error} 모든 재시도 실패 시
   */
  private async sendWithRetry(phoneNumber: string, message: string, retries = 2): Promise<void> {
    const currentProviderName = process.env.SMS_PROVIDER || 'dev';
    
    try {
      await this.provider.send(phoneNumber, message);
      
      // Reset failure count on success
      this.failureCount.delete(currentProviderName);
    } catch (error) {
      logger.error(`SMS send failed with ${currentProviderName}:`, error);
      
      // Track failures
      const failures = (this.failureCount.get(currentProviderName) || 0) + 1;
      this.failureCount.set(currentProviderName, failures);
      this.lastFailureTime.set(currentProviderName, Date.now());
      
      // Try retry with same provider
      if (retries > 0) {
        logger.info(`Retrying SMS send (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return this.sendWithRetry(phoneNumber, message, retries - 1);
      }
      
      // Try failover to another provider if available
      if (failures >= this.maxFailuresBeforeSwitch) {
        const fallbackProvider = this.getFallbackProvider(currentProviderName);
        if (fallbackProvider) {
          logger.warn(`Switching to fallback provider: ${fallbackProvider}`);
          this.initializeProvider(fallbackProvider);
          return this.sendWithRetry(phoneNumber, message, 1); // One retry with new provider
        }
      }
      
      throw error;
    }
  }
  
  /**
   * 펴백 제공자 조회
   * @private
   * @param {string} currentProvider - 현재 제공자
   * @returns {string | null} 펴백 제공자 이름
   */
  private getFallbackProvider(currentProvider: string): string | null {
    const providers = ['twilio', 'aligo', 'toast'];
    const available = providers.filter(p => p !== currentProvider);
    
    // Check which providers have credentials configured
    for (const provider of available) {
      switch (provider) {
        case 'twilio':
          if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            return 'twilio';
          }
          break;
        case 'aligo':
          if (process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID) {
            return 'aligo';
          }
          break;
        case 'toast':
          if (process.env.TOAST_APP_KEY && process.env.TOAST_SECRET_KEY) {
            return 'toast';
          }
          break;
      }
    }
    
    return null;
  }
  
  /**
   * 제공자 초기화
   * @private
   * @param {string} providerName - 제공자 이름
   * @returns {void}
   */
  private initializeProvider(providerName: string): void {
    try {
      switch (providerName) {
        case 'twilio':
          this.provider = new TwilioProvider();
          break;
        case 'aligo':
          this.provider = new AligoProvider();
          break;
        case 'toast':
          this.provider = new ToastSMSProvider();
          break;
        default:
          this.provider = this.createDevProvider();
      }
      process.env.SMS_PROVIDER = providerName;
    } catch (error) {
      logger.error(`Failed to initialize ${providerName} provider:`, error);
      this.provider = this.createDevProvider();
    }
  }
  
  /**
   * SMS 잔액 확인 (관리자 기능, 제공자별)
   * @returns {Promise<Object>} 잔액 및 상태 정보
   */
  async checkBalance(): Promise<{ provider: string; balance?: number; status: string; failureStats?: any }> {
    const provider = process.env.SMS_PROVIDER || 'dev';
    
    // Clean up old failure stats
    const now = Date.now();
    for (const [providerName, lastFailure] of this.lastFailureTime.entries()) {
      if (now - lastFailure > this.failureResetTime) {
        this.failureCount.delete(providerName);
        this.lastFailureTime.delete(providerName);
      }
    }
    
    const failureStats = {
      current: this.failureCount.get(provider) || 0,
      allProviders: Object.fromEntries(this.failureCount)
    };
    
    if (provider === 'dev') {
      return { provider: 'development', status: 'unlimited', failureStats };
    }

    // Provider-specific balance check implementations
    try {
      switch (provider) {
        case 'twilio':
          // Twilio doesn't have a traditional balance, it's pay-as-you-go
          return { provider: 'twilio', status: 'pay-as-you-go', failureStats };
          
        case 'aligo':
          // Aligo balance check would require API call
          const aligoResponse = await axios.get('https://apis.aligo.in/balance/', {
            params: {
              key: process.env.ALIGO_API_KEY,
              user_id: process.env.ALIGO_USER_ID
            }
          });
          return { 
            provider: 'aligo', 
            balance: aligoResponse.data.balance,
            status: aligoResponse.data.balance > 0 ? 'active' : 'insufficient',
            failureStats 
          };
          
        case 'toast':
          // Toast SMS balance check
          return { provider: 'toast', status: 'check not implemented', failureStats };
          
        default:
          return { provider, status: 'unknown provider', failureStats };
      }
    } catch (error) {
      logger.error('Failed to check SMS balance:', error);
      return { provider, status: 'error checking balance', failureStats };
    }
  }
  
  /**
   * SMS 통계 조회
   * @param {number} [days=7] - 조회 기간 (일)
   * @returns {Promise<any>} SMS 통계
   */
  async getStatistics(days = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    try {
      const stats = await prisma.sMSLog?.groupBy({
        by: ['provider', 'status', 'messageType'],
        _count: true,
        where: {
          createdAt: {
            gte: startDate
          }
        }
      });
      
      const dailyStats = await prisma.sMSLog?.groupBy({
        by: ['createdAt'],
        _count: true,
        where: {
          createdAt: {
            gte: startDate
          }
        }
      });
      
      return {
        summary: stats,
        daily: dailyStats,
        period: `${days} days`,
        providers: {
          current: process.env.SMS_PROVIDER || 'dev',
          failures: Object.fromEntries(this.failureCount)
        }
      };
    } catch (error) {
      logger.error('Failed to get SMS statistics:', error);
      return {
        error: 'Failed to retrieve statistics',
        providers: {
          current: process.env.SMS_PROVIDER || 'dev',
          failures: Object.fromEntries(this.failureCount)
        }
      };
    }
  }
}

export const smsService = new SMSService();