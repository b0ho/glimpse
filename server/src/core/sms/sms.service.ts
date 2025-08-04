import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EncryptionService } from '../encryption/encryption.service';
import * as twilio from 'twilio';
import axios from 'axios';

/**
 * 인증 코드 인터페이스
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
 */
interface SMSProvider {
  /**
   * SMS 전송
   */
  send(phoneNumber: string, message: string): Promise<void>;
}

/**
 * SMS 서비스
 * 
 * 다양한 SMS 제공자(Twilio, Aligo, Toast)를 통해 SMS를 발송합니다.
 */
@Injectable()
export class SmsService {
  private provider: SMSProvider;
  private readonly maxAttempts = 5;
  private readonly verificationTTL = 300; // 5 minutes
  private readonly rateLimit = 5; // 시간당 SMS 발송 제한

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
    private readonly encryptionService: EncryptionService,
  ) {
    // Initialize SMS provider based on configuration
    const providerType = this.configService.get('SMS_PROVIDER', 'console');
    
    switch (providerType) {
      case 'twilio':
        this.provider = new TwilioProvider(configService);
        break;
      case 'aligo':
        this.provider = new AligoProvider(configService);
        break;
      case 'toast':
        this.provider = new ToastSMSProvider(configService);
        break;
      default:
        this.provider = new ConsoleProvider(); // Development fallback
    }
  }

  /**
   * 인증 코드 발송
   */
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    // Clean phone number
    const cleanedNumber = this.cleanPhoneNumber(phoneNumber);
    
    // Check rate limit
    const rateLimitKey = `sms:ratelimit:${cleanedNumber}`;
    const sentCount = await this.cacheService.get<number>(rateLimitKey) || 0;
    
    if (sentCount >= this.rateLimit) {
      throw new Error('SMS rate limit exceeded. Please try again later.');
    }

    // Generate verification code
    const code = this.encryptionService.generateRandomCode(6);
    
    // Store verification code in cache
    const verificationData: VerificationCode = {
      code,
      phoneNumber: cleanedNumber,
      expiresAt: new Date(Date.now() + this.verificationTTL * 1000),
      attempts: 0,
    };
    
    await this.cacheService.set(
      `sms:verification:${cleanedNumber}`,
      verificationData,
      { ttl: this.verificationTTL }
    );

    // Send SMS
    const message = `[Glimpse] 인증번호: ${code}\n${Math.floor(this.verificationTTL / 60)}분 내에 입력해주세요.`;
    await this.provider.send(cleanedNumber, message);

    // Update rate limit counter
    await this.cacheService.set(rateLimitKey, sentCount + 1, { ttl: 3600 });

    // Log SMS activity
    await this.logSMSActivity(cleanedNumber, 'VERIFICATION');
  }

  /**
   * 인증 코드 확인
   */
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const cleanedNumber = this.cleanPhoneNumber(phoneNumber);
    const cacheKey = `sms:verification:${cleanedNumber}`;
    
    const verificationData = await this.cacheService.get<VerificationCode>(cacheKey);
    
    if (!verificationData) {
      throw new Error('Verification code expired or not found');
    }

    // Check attempts
    if (verificationData.attempts >= this.maxAttempts) {
      await this.cacheService.delete(cacheKey);
      throw new Error('Maximum verification attempts exceeded');
    }

    // Update attempts
    verificationData.attempts++;
    await this.cacheService.set(cacheKey, verificationData, { ttl: this.verificationTTL });

    // Verify code
    if (verificationData.code !== code) {
      throw new Error('Invalid verification code');
    }

    // Delete verification data on success
    await this.cacheService.delete(cacheKey);
    
    return true;
  }

  /**
   * 매칭 알림 SMS 발송
   */
  async sendMatchNotification(phoneNumber: string, matchedUserNickname: string): Promise<void> {
    const cleanedNumber = this.cleanPhoneNumber(phoneNumber);
    
    const message = `[Glimpse] 축하합니다! ${matchedUserNickname}님과 매칭되었어요 💕\n지금 앱에서 대화를 시작해보세요!`;
    
    await this.provider.send(cleanedNumber, message);
    await this.logSMSActivity(cleanedNumber, 'MATCH_NOTIFICATION');
  }

  /**
   * 프리미엄 구매 확인 SMS 발송
   */
  async sendPremiumPurchaseConfirmation(phoneNumber: string, packageName: string): Promise<void> {
    const cleanedNumber = this.cleanPhoneNumber(phoneNumber);
    
    const message = `[Glimpse] ${packageName} 구매가 완료되었습니다.\n프리미엄 기능을 즐겨보세요!`;
    
    await this.provider.send(cleanedNumber, message);
    await this.logSMSActivity(cleanedNumber, 'PREMIUM_PURCHASE');
  }

  /**
   * 휴대폰 번호 정리
   */
  private cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    return phoneNumber.replace(/\D/g, '');
  }

  /**
   * SMS 활동 로그 기록
   */
  private async logSMSActivity(phoneNumber: string, type: string): Promise<void> {
    try {
      await this.prismaService.sMSLog.create({
        data: {
          phoneNumber: phoneNumber,
          message: `SMS sent to ${phoneNumber}`,
          messageType: type,
          provider: this.configService.get('SMS_PROVIDER', 'console'),
          status: 'SENT',
        },
      });
    } catch (error) {
      console.error('Failed to log SMS activity:', error);
    }
  }
}

/**
 * Twilio SMS 제공자 구현
 */
class TwilioProvider implements SMSProvider {
  private client: twilio.Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = configService.get('TWILIO_ACCOUNT_SID');
    const authToken = configService.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      throw new Error('Twilio configuration missing');
    }

    this.client = (twilio as any)(accountSid, authToken);
  }

  async send(phoneNumber: string, message: string): Promise<void> {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.configService.get('TWILIO_PHONE_NUMBER', ''),
        to: this.formatPhoneNumber(phoneNumber),
      });

      console.log(`SMS sent successfully via Twilio: ${result.sid}`);
    } catch (error) {
      console.error('Twilio SMS error:', error);
      throw new Error('SMS 전송에 실패했습니다');
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Convert Korean format to international
    // 01012345678 -> +821012345678
    if (phoneNumber.startsWith('010')) {
      return '+82' + phoneNumber.substring(1);
    }
    return phoneNumber;
  }
}

/**
 * 한국 SMS 제공자 (Aligo API) 구현
 */
class AligoProvider implements SMSProvider {
  private readonly apiUrl = 'https://apis.aligo.in/send/';
  private readonly apiKey: string;
  private readonly userId: string;
  private readonly sender: string;

  constructor(private configService: ConfigService) {
    this.apiKey = configService.get('ALIGO_API_KEY', '');
    this.userId = configService.get('ALIGO_USER_ID', '');
    this.sender = configService.get('ALIGO_SENDER', '');

    if (!this.apiKey || !this.userId) {
      throw new Error('Aligo configuration missing');
    }
  }

  async send(phoneNumber: string, message: string): Promise<void> {
    try {
      const formData = new URLSearchParams({
        key: this.apiKey,
        user_id: this.userId,
        sender: this.sender,
        receiver: phoneNumber,
        msg: message,
        msg_type: 'SMS',
        title: 'Glimpse 인증',
      });

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.result_code !== '1') {
        throw new Error(`Aligo error: ${response.data.message}`);
      }

      console.log(`SMS sent successfully via Aligo: ${response.data.msg_id}`);
    } catch (error) {
      console.error('Aligo SMS error:', error);
      throw new Error('SMS 전송에 실패했습니다');
    }
  }
}

/**
 * NHN Toast SMS 제공자 구현
 */
class ToastSMSProvider implements SMSProvider {
  private readonly apiUrl: string;
  private readonly appKey: string;
  private readonly secretKey: string;
  private readonly sendNo: string;

  constructor(private configService: ConfigService) {
    this.appKey = configService.get('TOAST_APP_KEY', '');
    this.secretKey = configService.get('TOAST_SECRET_KEY', '');
    this.sendNo = configService.get('TOAST_SEND_NO', '');
    
    const region = configService.get('TOAST_REGION', 'kr1');
    this.apiUrl = `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${this.appKey}/sender/sms`;

    if (!this.appKey || !this.secretKey) {
      throw new Error('Toast SMS configuration missing');
    }
  }

  async send(phoneNumber: string, message: string): Promise<void> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          body: message,
          sendNo: this.sendNo,
          recipientList: [
            {
              recipientNo: phoneNumber,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Secret-Key': this.secretKey,
          },
        }
      );

      if (!response.data.header.isSuccessful) {
        throw new Error(`Toast SMS error: ${response.data.header.resultMessage}`);
      }

      console.log(`SMS sent successfully via Toast: ${response.data.header.resultCode}`);
    } catch (error) {
      console.error('Toast SMS error:', error);
      throw new Error('SMS 전송에 실패했습니다');
    }
  }
}

/**
 * 개발용 콘솔 SMS 제공자
 */
class ConsoleProvider implements SMSProvider {
  async send(phoneNumber: string, message: string): Promise<void> {
    console.log(`
========================================
SMS Sent (Development Mode)
To: ${phoneNumber}
Message: ${message}
========================================
    `);
  }
}