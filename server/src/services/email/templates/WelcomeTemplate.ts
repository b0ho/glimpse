export class WelcomeTemplate {
  static generateWelcomeEmail(nickname: string) {
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
              <h3>⚡ 즉석 모임</h3>
              <p>지금 바로 주변에서 만날 수 있는 사람들과 즉석 모임에 참여해보세요.</p>
            </div>
            
            <div class="cta">
              <p><strong>지금 바로 앱을 열고 첫 매칭을 시작해보세요!</strong></p>
            </div>
            
            <p>💡 <strong>팁:</strong> 프로필을 충실히 작성할수록 더 좋은 매칭을 받을 수 있어요.</p>
          </div>
          
          <div class="footer">
            <p>도움이 필요하신가요? support@glimpse.app로 연락해주세요.</p>
            <p>© 2025 Glimpse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${nickname}님, Glimpse에 오신 것을 환영합니다!
      
      새로운 만남을 시작할 준비가 되었습니다.
      
      Glimpse의 주요 기능:
      - 완전한 익명성 보장
      - 그룹 기반 매칭
      - 즉석 모임 기능
      
      지금 바로 앱을 열고 첫 매칭을 시작해보세요!
      
      도움이 필요하신가요? support@glimpse.app로 연락해주세요.
    `;

    return { html, text };
  }
}