import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { cacheService } from './CacheService';
import { prisma } from '../config/database';
import { 
  EmailOptions, 
  EmailProvider, 
  VerificationEmailData,
  MatchNotificationData 
} from './email/types';
import { 
  SMTPProvider, 
  SendGridProvider, 
  SESProvider, 
  DevelopmentProvider 
} from './email/providers';
import { 
  VerificationTemplate, 
  WelcomeTemplate, 
  MatchTemplate 
} from './email/templates';

/**
 * 이메일 서비스 - 다양한 이메일 제공자를 통한 이메일 전송 관리
 * @class EmailService
 */
export class EmailService {
  /** 싱글톤 인스턴스 */
  private static instance: EmailService;
  /** 이메일 제공자 */
  private provider: EmailProvider;
  /** 시간당 전송 제한 */
  private readonly rateLimitPerHour = 100;
  /** 대량 전송 배치 크기 */
  private readonly bulkBatchSize = 50;
  /** 대량 전송 지연 시간 (ms) */
  private readonly bulkDelayMs = 1000;

  /**
   * EmailService 생성자
   * @private
   */
  private constructor() {
    // Select provider based on configuration
    const emailProvider = process.env.EMAIL_PROVIDER || 'dev';
    this.provider = this.initializeProvider(emailProvider);
  }

  /**
   * 이메일 제공자 초기화
   * @private
   * @param {string} providerName - 제공자 이름
   * @returns {EmailProvider} 이메일 제공자 인스턴스
   */
  private initializeProvider(providerName: string): EmailProvider {
    try {
      switch (providerName) {
        case 'smtp':
          return new SMTPProvider();
        case 'sendgrid':
          return new SendGridProvider();
        case 'ses':
          return new SESProvider();
        default:
          return new DevelopmentProvider();
      }
    } catch (error) {
      logger.warn(`Failed to initialize ${providerName} provider, falling back to development mode`, error);
      return new DevelopmentProvider();
    }
  }

  /**
   * 싱글톤 인스턴스 조회
   * @static
   * @returns {EmailService} 이메일 서비스 인스턴스
   */
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * 이메일 전송
   * @param {EmailOptions} options - 이메일 옵션
   * @returns {Promise<boolean>} 전송 성공 여부
   * @throws {Error} 전송 제한 초과 또는 중요 이메일 전송 실패 시
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Check rate limit
    const rateLimitKey = `email:ratelimit:${options.to}`;
    const sentCount = await cacheService.get<number>(rateLimitKey) || 0;
    
    if (sentCount >= this.rateLimitPerHour) {
      logger.warn(`Email rate limit exceeded for ${options.to}`);
      throw createError(429, '이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    }

    try {
      const result = await this.provider.sendEmail(options);
      
      if (result) {
        // Update rate limit counter
        await cacheService.set(rateLimitKey, sentCount + 1, { ttl: 3600 });
        
        // Log email activity
        await this.logEmailActivity(options);
      }

      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      
      // Don't throw for non-critical emails
      if (!this.isCriticalEmail(options.subject)) {
        return false;
      }
      
      throw error;
    }
  }

  /**
   * 이메일 활동 로깅
   * @private
   * @param {EmailOptions} options - 이메일 옵션
   * @returns {Promise<void>}
   */
  private async logEmailActivity(options: EmailOptions): Promise<void> {
    try {
      await prisma.emailLog.create({
        data: {
          to: options.to,
          subject: options.subject,
          provider: process.env.EMAIL_PROVIDER || 'dev',
          status: 'SENT',
          sent_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to log email activity:', error);
    }
  }

  /**
   * 중요 이메일 여부 확인
   * @private
   * @param {string} subject - 이메일 제목
   * @returns {boolean} 중요 이메일 여부
   */
  private isCriticalEmail(subject: string): boolean {
    const criticalKeywords = ['인증', '비밀번호', '결제', '보안'];
    return criticalKeywords.some(keyword => subject.includes(keyword));
  }

  /**
   * 회사 인증 이메일 전송
   * @param {VerificationEmailData} data - 인증 이메일 데이터
   * @returns {Promise<boolean>} 전송 성공 여부
   */
  async sendCompanyVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    const { html, text } = VerificationTemplate.generateCompanyVerificationEmail(data);
    
    return await this.sendEmail({
      to: data.userEmail,
      subject: `[Glimpse] ${data.companyName} 회사 인증 코드`,
      html,
      text
    });
  }

  /**
   * 환영 이메일 전송
   * @param {string} userEmail - 사용자 이메일
   * @param {string} nickname - 사용자 닉네임
   * @returns {Promise<boolean>} 전송 성공 여부
   */
  async sendWelcomeEmail(userEmail: string, nickname: string): Promise<boolean> {
    const { html, text } = WelcomeTemplate.generateWelcomeEmail(nickname);
    
    return await this.sendEmail({
      to: userEmail,
      subject: `[Glimpse] ${nickname}님, 환영합니다! 🎉`,
      html,
      text
    });
  }

  /**
   * 매칭 알림 이메일 전송
   * @param {MatchNotificationData} data - 매칭 알림 데이터
   * @returns {Promise<boolean>} 전송 성공 여부
   */
  async sendMatchNotificationEmail(data: MatchNotificationData): Promise<boolean> {
    const { html, text } = MatchTemplate.generateMatchNotificationEmail(data);
    
    return await this.sendEmail({
      to: data.userEmail,
      subject: `[Glimpse] 🎉 새로운 매칭이 성사되었습니다!`,
      html,
      text
    });
  }

  /**
   * 비밀번호 재설정 이메일 전송
   * @param {string} userEmail - 사용자 이메일
   * @param {string} resetToken - 재설정 토큰
   * @returns {Promise<boolean>} 전송 성공 여부
   */
  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>비밀번호 재설정</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>비밀번호 재설정</h1>
          <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요:</p>
          <p><a href="${resetLink}" class="button">비밀번호 재설정</a></p>
          <p>이 링크는 1시간 후에 만료됩니다.</p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: '[Glimpse] 비밀번호 재설정',
      html,
      text: `비밀번호를 재설정하려면 다음 링크를 방문하세요: ${resetLink}`
    });
  }

  /**
   * 대량 이메일 전송
   * @param {EmailOptions[]} emails - 이메일 옵션 배열
   * @returns {Promise<Object>} 전송 결과 (성공, 실패, 오류 정보)
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>
    };

    // Process emails in batches
    for (let i = 0; i < emails.length; i += this.bulkBatchSize) {
      const batch = emails.slice(i, i + this.bulkBatchSize);
      
      await Promise.all(
        batch.map(async (emailOptions) => {
          try {
            await this.sendEmail(emailOptions);
            results.successful++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              email: emailOptions.to,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        })
      );

      // Add delay between batches to avoid rate limiting
      if (i + this.bulkBatchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, this.bulkDelayMs));
      }
    }

    return results;
  }

  /**
   * 이메일 제공자 상태 확인
   * @returns {Promise<boolean>} 제공자 정상 동작 여부
   */
  async checkProviderHealth(): Promise<boolean> {
    try {
      return await this.provider.checkHealth();
    } catch (error) {
      logger.error('Email provider health check failed:', error);
      return false;
    }
  }

  /**
   * 사용자 이메일 통계 조회
   * @param {string} userEmail - 사용자 이메일
   * @returns {Promise<Object>} 이메일 통계 (전송 수, 마지막 전송 시간)
   */
  async getEmailStats(userEmail: string): Promise<{
    sent: number;
    lastSent: Date | null;
  }> {
    const stats = await prisma.emailLog.findMany({
      where: { to: userEmail },
      orderBy: { sent_at: 'desc' },
      take: 100
    });

    return {
      sent: stats.length,
      lastSent: stats[0]?.sent_at || null
    };
  }
}

export const emailService = EmailService.getInstance();