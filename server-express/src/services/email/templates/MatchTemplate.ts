import { MatchNotificationData } from '../types';

export class MatchTemplate {
  static generateMatchNotificationEmail(data: MatchNotificationData) {
    const { userNickname, matchNickname, groupName } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>🎆 새로운 매칭이 성사되었습니다!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
          .match-banner { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; text-align: center; margin: 20px 0; }
          .match-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .cta { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 16px 32px; background: #007AFF; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 Glimpse</div>
          </div>
          
          <div class="match-banner">
            <h1 style="margin: 0; font-size: 48px;">🎆</h1>
            <h2 style="margin: 10px 0;">축하합니다, ${userNickname}님!</h2>
            <p style="margin: 0; font-size: 18px;">새로운 매칭이 성사되었습니다!</p>
          </div>
          
          <div class="match-info">
            <p>👥 <strong>매칭 닉네임:</strong> ${matchNickname}</p>
            <p>🏢 <strong>그룹:</strong> ${groupName}</p>
          </div>
          
          <p>서로의 호감이 확인되었습니다! 이제 대화를 시작할 수 있어요.</p>
          
          <div class="cta">
            <a href="glimpse://matches" class="button">대화 시작하기</a>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px;">
            💡 첫 메시지는 상대방에게 좋은 인상을 주는 것이 중요해요!
          </p>
          
          <div class="footer">
            <p>이 알림이 싫으신가요? 앱에서 알림 설정을 변경해주세요.</p>
            <p>© 2025 Glimpse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      축하합니다, ${userNickname}님!
      
      새로운 매칭이 성사되었습니다!
      
      매칭 정보:
      - 닉네임: ${matchNickname}
      - 그룹: ${groupName}
      
      지금 앱에서 대화를 시작해보세요!
      
      Glimpse 드림
    `;

    return { html, text };
  }
}