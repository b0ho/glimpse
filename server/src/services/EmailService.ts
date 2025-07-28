import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { cacheService } from './CacheService';
import { prisma } from "../config/database";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface VerificationEmailData {
  userEmail: string;
  companyName: string;
  verificationCode: string;
  expiresInMinutes: number;
}

interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<boolean>;
  checkHealth(): Promise<boolean>;
}

// SMTP Provider (Gmail, Naver, etc.)
class SMTPProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const result = await this.transporter.sendMail({
        from: options.from || process.env.SMTP_FROM || 'noreply@glimpse.app',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      });
      logger.info(`Email sent via SMTP: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error('SMTP email error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

// SendGrid Provider
class SendGridProvider implements EmailProvider {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SendGrid API key not configured');
    }
    sgMail.setApiKey(apiKey);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const msg = {
        to: options.to,
        from: options.from || process.env.SENDGRID_FROM || 'noreply@glimpse.app',
        subject: options.subject,
        text: options.text || '',
        html: options.html,
        attachments: options.attachments?.map(att => ({
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
          filename: att.filename,
          type: att.contentType
        }))
      };

      const response = await sgMail.send(msg);
      logger.info(`Email sent via SendGrid: ${response[0].statusCode}`);
      return true;
    } catch (error) {
      logger.error('SendGrid email error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    // SendGrid doesn't have a specific health check endpoint
    return !!process.env.SENDGRID_API_KEY;
  }
}

// AWS SES Provider
class SESProvider implements EmailProvider {
  private client: SESClient;

  constructor() {
    this.client = new SESClient({
      region: process.env.AWS_REGION || 'ap-northeast-2', // Seoul region
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const command = new SendEmailCommand({
        Source: options.from || process.env.SES_FROM || 'noreply@glimpse.app',
        Destination: {
          ToAddresses: [options.to]
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: options.html,
              Charset: 'UTF-8'
            },
            Text: options.text ? {
              Data: options.text,
              Charset: 'UTF-8'
            } : undefined
          }
        }
      });

      const response = await this.client.send(command);
      logger.info(`Email sent via AWS SES: ${response.MessageId}`);
      return true;
    } catch (error) {
      logger.error('AWS SES email error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  }
}

// Development Provider (console logging)
class DevelopmentProvider implements EmailProvider {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    logger.info('📧 [DEV EMAIL]', {
      to: options.to,
      subject: options.subject,
      preview: options.text?.substring(0, 100) || options.html.substring(0, 100)
    });
    return true;
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}

export class EmailService {
  private static instance: EmailService;
  private provider: EmailProvider;
  private readonly rateLimitPerHour = 100;
  private readonly bulkBatchSize = 50;
  private readonly bulkDelayMs = 1000;

  private constructor() {
    // Select provider based on configuration
    const emailProvider = process.env.EMAIL_PROVIDER || 'dev';

    switch (emailProvider) {
      case 'smtp':
        try {
          this.provider = new SMTPProvider();
        } catch {
          logger.warn('Falling back to development email mode');
          this.provider = new DevelopmentProvider();
        }
        break;
      case 'sendgrid':
        try {
          this.provider = new SendGridProvider();
        } catch {
          logger.warn('Falling back to development email mode');
          this.provider = new DevelopmentProvider();
        }
        break;
      case 'ses':
        try {
          this.provider = new SESProvider();
        } catch {
          logger.warn('Falling back to development email mode');
          this.provider = new DevelopmentProvider();
        }
        break;
      default:
        this.provider = new DevelopmentProvider();
    }
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

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

  private isCriticalEmail(subject: string): boolean {
    const criticalKeywords = ['인증', '비밀번호', '결제', '보안'];
    return criticalKeywords.some(keyword => subject.includes(keyword));
  }

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
              <li>이 코드는 <strong>${expiresInMinutes}분</strong> 후에 만료됩니다</li>
              <li>코드를 다른 사람과 공유하지 마세요</li>
              <li>요청하지 않은 인증이라면 이 이메일을 무시해주세요</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>문의: support@glimpse.app</p>
            <p>© 2025 Glimpse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Glimpse 회사 인증
      
      ${companyName}에서 Glimpse 회사 그룹에 가입하기 위한 인증 코드: ${verificationCode}
      
      이 코드는 ${expiresInMinutes}분 후에 만료됩니다.
      코드를 다른 사람과 공유하지 마세요.
      
      문의: support@glimpse.app
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: `[Glimpse] ${companyName} 회사 인증 코드`,
      html,
      text
    });
  }

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
          .content { padding: 20px 0; }
          .feature { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .cta { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 Glimpse</div>
            <h1>${nickname}님, 환영합니다! 🎉</h1>
          </div>
          
          <div class="content">
            <p>Glimpse에 가입해주셔서 감사합니다! 새로운 만남을 시작할 준비가 되었습니다.</p>
            
            <div class="feature">
              <h3>🎭 완전한 익명성</h3>
              <p>서로 좋아요를 누르기 전까지는 완전히 익명으로 상대를 만날 수 있습니다.</p>
            </div>
            
            <div class="feature">
              <h3>🏢 그룹 기반 매칭</h3>
              <p>회사, 대학교, 취미 그룹에서 비슷한 관심사를 가진 사람들과 만나보세요.</p>
            </div>
            
            <div class="feature">
              <h3>💬 안전한 채팅</h3>
              <p>서로 매칭된 후에만 대화를 시작할 수 있어 더욱 안전합니다.</p>
            </div>
            
            <div class="cta">
              <p>지금 바로 첫 번째 그룹에 가입해보세요!</p>
              <a href="https://glimpse.app" class="button">앱으로 이동하기</a>
            </div>
          </div>
          
          <div class="footer">
            <p>궁금한 점이 있으시면 언제든 문의해주세요.</p>
            <p>문의: support@glimpse.app</p>
            <p>© 2025 Glimpse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${nickname}님, Glimpse에 오신 것을 환영합니다!
      
      Glimpse에 가입해주셔서 감사합니다! 새로운 만남을 시작할 준비가 되었습니다.
      
      주요 기능:
      - 완전한 익명성: 서로 좋아요를 누르기 전까지는 완전히 익명
      - 그룹 기반 매칭: 회사, 대학교, 취미 그룹에서 만남
      - 안전한 채팅: 매칭된 후에만 대화 가능
      
      지금 바로 첫 번째 그룹에 가입해보세요!
      
      문의: support@glimpse.app
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: '[Glimpse] 환영합니다! 새로운 만남을 시작해보세요 ✨',
      html,
      text
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>비밀번호 재설정</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 Glimpse</div>
            <h1>비밀번호 재설정</h1>
          </div>
          
          <div class="content">
            <p>비밀번호 재설정을 요청하셨습니다.</p>
            <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
            </div>
            
            <p>버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ 보안 안내:</strong>
            <ul>
              <li>이 링크는 1시간 후에 만료됩니다</li>
              <li>비밀번호 재설정을 요청하지 않았다면 이 이메일을 무시해주세요</li>
              <li>링크를 다른 사람과 공유하지 마세요</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>문의: support@glimpse.app</p>
            <p>© 2025 Glimpse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      비밀번호 재설정
      
      비밀번호 재설정을 요청하셨습니다.
      아래 링크를 클릭하여 새로운 비밀번호를 설정해주세요:
      
      ${resetUrl}
      
      보안 안내:
      - 이 링크는 1시간 후에 만료됩니다
      - 비밀번호 재설정을 요청하지 않았다면 이 이메일을 무시해주세요
      - 링크를 다른 사람과 공유하지 마세요
      
      문의: support@glimpse.app
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: '[Glimpse] 비밀번호 재설정 요청',
      html,
      text
    });
  }

  async sendReportNotificationEmail(reportType: string, reportedUser: string, reason: string, details?: string): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@glimpse.app';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>[신고] ${reportType} 신고 접수</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 신고 접수 알림</h1>
          </div>
          
          <div class="content">
            <div class="info">
              <h3>신고 정보</h3>
              <p><strong>신고 유형:</strong> ${reportType}</p>
              <p><strong>신고 대상:</strong> ${reportedUser}</p>
              <p><strong>신고 사유:</strong> ${reason}</p>
              ${details ? `<p><strong>상세 내용:</strong> ${details}</p>` : ''}
              <p><strong>신고 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
            </div>
            
            <div class="info">
              <h3>대응 필요 사항</h3>
              <ul>
                <li>신고 내용 검토</li>
                <li>필요시 추가 조사 진행</li>
                <li>정책 위반 여부 판단</li>
                <li>적절한 조치 시행</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.ADMIN_URL}/reports" style="background: #007AFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">관리자 페이지에서 확인</a>
            </p>
          </div>
          
          <div class="footer">
            <p>Glimpse Admin System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: adminEmail,
      subject: `[Glimpse 신고] ${reportType} - ${reason}`,
      html
    });
  }

  async sendSubscriptionRenewalReminder(userEmail: string, nickname: string, expiresAt: Date): Promise<boolean> {
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>프리미엄 구독 만료 안내</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .expiry { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; }
          .benefits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 Glimpse</div>
            <h1>프리미엄 구독 만료 예정</h1>
          </div>
          
          <div class="content">
            <p>${nickname}님, 안녕하세요!</p>
            <p>귀하의 Glimpse 프리미엄 구독이 곧 만료됩니다.</p>
            
            <div class="expiry">
              <h2>🔔 만료까지 ${daysLeft}일 남았습니다</h2>
              <p>만료일: ${expiresAt.toLocaleDateString('ko-KR')}</p>
            </div>
            
            <div class="benefits">
              <h3>프리미엄 혜택을 계속 누리세요!</h3>
              <ul>
                <li>✨ 무제한 좋아요</li>
                <li>👀 좋아요 받은 사람 확인</li>
                <li>🚀 우선 매칭</li>
                <li>↩️ 좋아요 되돌리기</li>
                <li>💝 슈퍼 좋아요</li>
                <li>✓ 읽음 표시</li>
                <li>🟢 온라인 상태 표시</li>
                <li>⭐ 프리미엄 배지</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="https://glimpse.app/premium" class="button">지금 갱신하기</a>
            </div>
            
            <p style="text-align: center; color: #666;">
              구독을 갱신하지 않으면 ${expiresAt.toLocaleDateString('ko-KR')} 이후 프리미엄 혜택이 중단됩니다.
            </p>
          </div>
          
          <div class="footer">
            <p>문의: support@glimpse.app</p>
            <p>© 2025 Glimpse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${nickname}님, 안녕하세요!
      
      귀하의 Glimpse 프리미엄 구독이 ${daysLeft}일 후 만료됩니다.
      만료일: ${expiresAt.toLocaleDateString('ko-KR')}
      
      프리미엄 혜택:
      - 무제한 좋아요
      - 좋아요 받은 사람 확인
      - 우선 매칭
      - 좋아요 되돌리기
      - 슈퍼 좋아요
      - 읽음 표시
      - 온라인 상태 표시
      - 프리미엄 배지
      
      지금 갱신하기: https://glimpse.app/premium
      
      문의: support@glimpse.app
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: `[Glimpse] 프리미엄 구독이 ${daysLeft}일 후 만료됩니다`,
      html,
      text
    });
  }

  async sendMatchNotificationEmail(userEmail: string, userNickname: string, matchedNickname: string, groupName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>새로운 매칭이 성사되었습니다!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
          .match-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: white; color: #667eea; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 Glimpse</div>
          </div>
          
          <div class="match-card">
            <h1>🎉 축하합니다!</h1>
            <h2>${matchedNickname}님과 매칭되었습니다!</h2>
            <p>${groupName}에서 서로의 마음이 통했네요!</p>
            <a href="https://glimpse.app/matches" class="button">지금 대화 시작하기</a>
          </div>
          
          <div style="text-align: center; padding: 20px;">
            <p>이제 ${matchedNickname}님과 자유롭게 대화를 나눌 수 있습니다.</p>
            <p>좋은 만남이 되기를 바랍니다! 💕</p>
          </div>
          
          <div class="footer">
            <p>문의: support@glimpse.app</p>
            <p>© 2025 Glimpse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: `[Glimpse] 🎉 ${matchedNickname}님과 매칭되었습니다!`,
      html
    });
  }

  async sendBulkEmail(recipients: string[], subject: string, html: string, options?: { text?: string }): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    const failedRecipients: string[] = [];

    const batches = [];
    for (let i = 0; i < recipients.length; i += this.bulkBatchSize) {
      batches.push(recipients.slice(i, i + this.bulkBatchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(async (recipient) => {
        try {
          await this.sendEmail({ 
            to: recipient, 
            subject, 
            html,
            text: options?.text 
          });
          sent++;
        } catch (error) {
          logger.error(`Failed to send bulk email to ${recipient}:`, error);
          failed++;
          failedRecipients.push(recipient);
        }
      });

      await Promise.all(promises);
      
      // Wait between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.bulkDelayMs));
      }
    }

    // Log bulk email results
    logger.info(`Bulk email completed: ${sent} sent, ${failed} failed`, {
      subject,
      totalRecipients: recipients.length,
      failedRecipients: failedRecipients.length > 0 ? failedRecipients : undefined
    });

    return { sent, failed };
  }

  async checkHealth(): Promise<{ provider: string; healthy: boolean }> {
    const provider = process.env.EMAIL_PROVIDER || 'dev';
    const healthy = await this.provider.checkHealth();
    
    return { provider, healthy };
  }

  // Backward compatibility methods
  async testEmailConnection(): Promise<boolean> {
    const health = await this.checkHealth();
    return health.healthy;
  }

  async sendVerificationEmail(email: string, verificationCode: string, companyName: string): Promise<boolean> {
    return this.sendCompanyVerificationEmail({
      userEmail: email,
      companyName,
      verificationCode,
      expiresInMinutes: 30
    });
  }

  async sendHrApprovalRequest(
    supervisorEmail: string,
    employeeId: string,
    department: string,
    position: string,
    companyName: string
  ): Promise<boolean> {
    const approvalToken = crypto.randomUUID();
    const approvalUrl = `${process.env.ADMIN_URL}/hr-approval?token=${approvalToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>직원 인증 승인 요청</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .employee-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .button.reject { background: #dc3545; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 Glimpse</div>
            <h1>직원 인증 승인 요청</h1>
          </div>
          
          <div class="content">
            <p>안녕하세요,</p>
            <p>Glimpse 앱에서 ${companyName} 직원 인증 요청이 접수되었습니다.</p>
            
            <div class="employee-info">
              <h3>직원 정보</h3>
              <p><strong>사번:</strong> ${employeeId}</p>
              <p><strong>부서:</strong> ${department}</p>
              <p><strong>직급:</strong> ${position || '미기재'}</p>
              <p><strong>요청 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
            </div>
            
            <p>해당 직원이 귀하의 회사에 소속되어 있는지 확인 후 승인 또는 거부해주세요.</p>
            
            <div style="text-align: center;">
              <a href="${approvalUrl}&action=approve" class="button">승인하기</a>
              <a href="${approvalUrl}&action=reject" class="button reject">거부하기</a>
            </div>
            
            <p style="text-align: center; color: #666; margin-top: 20px;">
              이 링크는 48시간 후에 만료됩니다.
            </p>
          </div>
          
          <div class="footer">
            <p>문의: support@glimpse.app</p>
            <p>© 2025 Glimpse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Store approval token in cache
    await cacheService.set(
      `hr-approval:${approvalToken}`,
      { supervisorEmail, employeeId, department, position, companyName },
      { ttl: 172800 } // 48 hours
    );

    return await this.sendEmail({
      to: supervisorEmail,
      subject: `[Glimpse] ${companyName} 직원 인증 승인 요청`,
      html
    });
  }
}

export const emailService = EmailService.getInstance();