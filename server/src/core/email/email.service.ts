import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import * as sgMail from '@sendgrid/mail';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/**
 * 이메일 옵션 인터페이스
 */
interface EmailOptions {
  /** 수신자 이메일 주소 */
  to: string;
  /** 이메일 제목 */
  subject: string;
  /** HTML 콘텐츠 */
  html: string;
  /** 텍스트 콘텐츠 */
  text?: string;
  /** 발신자 이메일 주소 */
  from?: string;
  /** 첨부 파일 리스트 */
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * 인증 이메일 데이터 인터페이스
 */
interface VerificationEmailData {
  /** 사용자 이메일 주소 */
  userEmail: string;
  /** 회사명 */
  companyName: string;
  /** 인증 코드 */
  verificationCode: string;
  /** 만료 시간(분) */
  expiresInMinutes: number;
}

/**
 * 이메일 서비스
 * 
 * 다양한 이메일 제공자(SMTP, SendGrid, AWS SES)를 통해 이메일을 발송합니다.
 */
@Injectable()
export class EmailService {
  private sesClient?: SESClient;
  private readonly rateLimit = 100; // 시간당 이메일 발송 제한

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
  ) {
    // Initialize SendGrid if configured
    const sendgridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (sendgridApiKey) {
      sgMail.setApiKey(sendgridApiKey);
    }

    // Initialize AWS SES if configured
    const awsRegion = this.configService.get<string>('AWS_REGION');
    if (awsRegion) {
      this.sesClient = new SESClient({
        region: awsRegion,
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
        },
      });
    }
  }

  /**
   * 이메일 발송
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Check rate limit
      const rateLimitKey = `email:ratelimit:${options.to}`;
      const sentCount = await this.cacheService.get<number>(rateLimitKey) || 0;
      
      if (sentCount >= this.rateLimit) {
        throw new Error('Email rate limit exceeded');
      }

      const provider = this.configService.get('EMAIL_PROVIDER', 'smtp');
      let result = false;

      switch (provider) {
        case 'sendgrid':
          result = await this.sendViaSendGrid(options);
          break;
        
        case 'ses':
          result = await this.sendViaSES(options);
          break;
        
        case 'smtp':
        default:
          result = await this.sendViaSMTP(options);
          break;
      }

      if (result) {
        // Update rate limit counter
        await this.cacheService.set(rateLimitKey, sentCount + 1, { ttl: 3600 });
        
        // Log email activity
        await this.logEmailActivity(options);
      }

      return result;
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Don't throw for non-critical emails
      if (!this.isCriticalEmail(options.subject)) {
        return false;
      }
      
      throw error;
    }
  }

  /**
   * SMTP를 통한 이메일 발송
   */
  private async sendViaSMTP(options: EmailOptions): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        from: options.from,
        attachments: options.attachments,
      });
      return true;
    } catch (error) {
      console.error('SMTP email error:', error);
      throw error;
    }
  }

  /**
   * SendGrid를 통한 이메일 발송
   */
  private async sendViaSendGrid(options: EmailOptions): Promise<boolean> {
    try {
      const msg = {
        to: options.to,
        from: options.from || this.configService.get('SENDGRID_FROM', 'noreply@glimpse.app'),
        subject: options.subject,
        html: options.html,
        text: options.text,
      };
      
      await sgMail.send(msg as any);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      throw error;
    }
  }

  /**
   * AWS SES를 통한 이메일 발송
   */
  private async sendViaSES(options: EmailOptions): Promise<boolean> {
    if (!this.sesClient) {
      throw new Error('SES client not initialized');
    }

    try {
      const command = new SendEmailCommand({
        Source: options.from || this.configService.get('SES_FROM', 'noreply@glimpse.app'),
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: options.html,
              Charset: 'UTF-8',
            },
            Text: options.text ? {
              Data: options.text,
              Charset: 'UTF-8',
            } : undefined,
          },
        },
      });

      await this.sesClient.send(command);
      return true;
    } catch (error) {
      console.error('SES email error:', error);
      throw error;
    }
  }

  /**
   * 이메일 활동 로그 기록
   */
  private async logEmailActivity(options: EmailOptions): Promise<void> {
    try {
      await this.prismaService.emailLog.create({
        data: {
          to: options.to,
          subject: options.subject,
          provider: this.configService.get('EMAIL_PROVIDER', 'smtp'),
          status: 'SENT',
          sent_at: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log email activity:', error);
    }
  }

  /**
   * 중요 이메일 여부 확인
   */
  private isCriticalEmail(subject: string): boolean {
    const criticalKeywords = ['인증', '비밀번호', '결제', '보안'];
    return criticalKeywords.some(keyword => subject.includes(keyword));
  }

  /**
   * 회사 인증 이메일 발송
   */
  async sendCompanyVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    const { userEmail, companyName, verificationCode, expiresInMinutes } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>회사 인증 코드</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #007AFF; text-align: center; letter-spacing: 4px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 Glimpse</div>
            <h1>${companyName} 회사 인증</h1>
          </div>
          
          <div class="content">
            <p>안녕하세요!</p>
            <p><strong>${companyName}</strong>에서 Glimpse 회사 그룹에 가입하기 위한 인증 코드입니다.</p>
            
            <div class="code">${verificationCode}</div>
            
            <p>위 인증 코드를 앱에 입력해주세요.</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ 중요사항:</strong>
            <ul>
              <li>이 코드는 ${expiresInMinutes}분 후에 만료됩니다.</li>
              <li>이 코드를 다른 사람과 공유하지 마세요.</li>
              <li>이 이메일을 요청하지 않으셨다면 무시하세요.</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 Glimpse. All rights reserved.</p>
            <p>이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${companyName} 회사 인증

안녕하세요!

${companyName}에서 Glimpse 회사 그룹에 가입하기 위한 인증 코드입니다.

인증 코드: ${verificationCode}

중요사항:
- 이 코드는 ${expiresInMinutes}분 후에 만료됩니다.
- 이 코드를 다른 사람과 공유하지 마세요.
- 이 이메일을 요청하지 않으셨다면 무시하세요.

© 2024 Glimpse. All rights reserved.
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `[Glimpse] ${companyName} 회사 인증 코드`,
      html,
      text,
    });
  }

  /**
   * 매칭 알림 이메일 발송
   */
  async sendMatchNotificationEmail(
    userEmail: string,
    matchedUserNickname: string,
    groupName: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>새로운 매칭!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .match-icon { font-size: 48px; margin: 20px 0; }
          .cta { display: inline-block; background: #007AFF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 Glimpse</div>
            <h1>축하합니다! 새로운 매칭이 성사되었어요 🎉</h1>
          </div>
          
          <div class="content">
            <div class="match-icon">💕</div>
            <p><strong>${groupName}</strong> 그룹에서</p>
            <p><strong>${matchedUserNickname}</strong>님과 서로 좋아요를 눌렀어요!</p>
            <p>지금 앱에서 대화를 시작해보세요.</p>
            
            <a href="glimpse://matches" class="cta">대화 시작하기</a>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 Glimpse. All rights reserved.</p>
            <p>알림 설정은 앱에서 변경할 수 있습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `[Glimpse] ${matchedUserNickname}님과 매칭되었어요! 💕`,
      html,
    });
  }

  /**
   * 환영 이메일 발송
   */
  async sendWelcomeEmail(userEmail: string, nickname: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Glimpse에 오신 것을 환영합니다!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .feature { margin: 15px 0; padding-left: 30px; }
          .cta { display: inline-block; background: #007AFF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 Glimpse</div>
            <h1>환영합니다, ${nickname}님! 👋</h1>
          </div>
          
          <div class="content">
            <p>Glimpse에 가입해주셔서 감사합니다!</p>
            <p>이제 다음과 같은 기능을 사용하실 수 있어요:</p>
            
            <div class="feature">✨ 익명으로 안전하게 관심 표현하기</div>
            <div class="feature">💕 서로 좋아요를 누르면 매칭</div>
            <div class="feature">💬 매칭된 사람과 채팅하기</div>
            <div class="feature">🏢 회사/학교 그룹 가입하기</div>
            <div class="feature">📍 위치 기반 그룹 참여하기</div>
            
            <center>
              <a href="glimpse://home" class="cta">지금 시작하기</a>
            </center>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 Glimpse. All rights reserved.</p>
            <p>도움이 필요하시면 support@glimpse.app으로 문의해주세요.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `[Glimpse] ${nickname}님, 환영합니다! 🎉`,
      html,
    });
  }

  /**
   * 결제 확인 이메일 발송
   */
  async sendPaymentConfirmationEmail(
    userEmail: string,
    itemName: string,
    amount: number,
    currency: string = 'KRW'
  ): Promise<boolean> {
    const formattedAmount = new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
    }).format(amount);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>결제 확인</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .receipt { background: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .total { font-size: 18px; font-weight: bold; color: #007AFF; border-top: 2px solid #dee2e6; padding-top: 10px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 Glimpse</div>
            <h1>결제가 완료되었습니다</h1>
          </div>
          
          <div class="content">
            <p>결제가 정상적으로 처리되었습니다.</p>
            
            <div class="receipt">
              <div class="receipt-row">
                <span>상품명</span>
                <span>${itemName}</span>
              </div>
              <div class="receipt-row">
                <span>결제일시</span>
                <span>${new Date().toLocaleString('ko-KR')}</span>
              </div>
              <div class="receipt-row total">
                <span>결제금액</span>
                <span>${formattedAmount}</span>
              </div>
            </div>
            
            <p>결제 내역은 앱의 프로필 > 결제 내역에서 확인하실 수 있습니다.</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 Glimpse. All rights reserved.</p>
            <p>결제 관련 문의: payment@glimpse.app</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `[Glimpse] 결제 확인 - ${itemName}`,
      html,
    });
  }
}
