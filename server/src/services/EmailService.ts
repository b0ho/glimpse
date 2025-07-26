import nodemailer from 'nodemailer';
import { prisma } from "../config/database";



interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface VerificationEmailData {
  userEmail: string;
  companyName: string;
  verificationCode: string;
  expiresInMinutes: number;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: options.from || process.env.SMTP_FROM || 'noreply@glimpse.app',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
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

    return await this.sendEmail({
      to: userEmail,
      subject: '[Glimpse] 환영합니다! 새로운 만남을 시작해보세요 ✨',
      html
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

    return await this.sendEmail({
      to: userEmail,
      subject: '[Glimpse] 비밀번호 재설정 요청',
      html
    });
  }

  async sendReportNotificationEmail(reportType: string, reportedUser: string, reason: string): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@glimpse.app';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>[신고] ${reportType} 신고 접수</title>
      </head>
      <body>
        <h1>신고 접수 알림</h1>
        <p><strong>신고 유형:</strong> ${reportType}</p>
        <p><strong>신고 대상:</strong> ${reportedUser}</p>
        <p><strong>신고 사유:</strong> ${reason}</p>
        <p><strong>신고 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
        
        <p>관리자 페이지에서 확인하고 적절한 조치를 취해주세요.</p>
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
            <p>${nickname}님의 프리미엄 구독이 곧 만료됩니다.</p>
            
            <div class="expiry">
              <h3>🔔 만료까지 ${daysLeft}일 남았습니다</h3>
              <p>만료일: ${expiresAt.toLocaleDateString('ko-KR')}</p>
            </div>
            
            <p>프리미엄 혜택을 계속 이용하시려면 구독을 갱신해주세요:</p>
            <ul>
              <li>무제한 좋아요</li>
              <li>좋아요 받은 사람 확인</li>
              <li>우선 매칭</li>
              <li>좋아요 되돌리기</li>
              <li>슈퍼 좋아요</li>
              <li>읽음 표시</li>
              <li>온라인 상태 표시</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://glimpse.app/premium" class="button">구독 갱신하기</a>
            </div>
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
      subject: `[Glimpse] 프리미엄 구독이 ${daysLeft}일 후 만료됩니다`,
      html
    });
  }

  async testEmailConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  async sendBulkEmail(recipients: string[], subject: string, html: string): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const batchSize = 50; // Send in batches to avoid rate limiting
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(async (recipient) => {
        try {
          await this.sendEmail({ to: recipient, subject, html });
          sent++;
        } catch (error) {
          console.error(`Failed to send email to ${recipient}:`, error);
          failed++;
        }
      });

      await Promise.all(promises);
      
      // Wait 1 second between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { sent, failed };
  }

  // Method aliases for compatibility
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
              <a href="#" class="button">승인하기</a>
              <a href="#" class="button reject">거부하기</a>
            </div>
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
      to: supervisorEmail,
      subject: `[Glimpse] ${companyName} 직원 인증 승인 요청`,
      html
    });
  }
}

export const emailService = new EmailService();