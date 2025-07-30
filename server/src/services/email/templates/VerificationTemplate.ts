import { VerificationEmailData } from '../types';

export class VerificationTemplate {
  static generateCompanyVerificationEmail(data: VerificationEmailData) {
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

    return { html, text };
  }
}