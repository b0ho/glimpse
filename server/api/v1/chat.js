// v1 API 채팅 엔드포인트 (실제 NestJS와 동일한 응답 구조)
module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-auth');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    
    if (url.includes('/rooms') && method === 'GET') {
      res.status(200).json({
        success: true,
        data: {
          rooms: [],
          pagination: { page: 1, limit: 20, total: 0, hasNext: false }
        }
      });
    } else if (url.includes('/summary') && method === 'GET') {
      res.status(200).json({
        success: true,
        data: {
          totalRooms: 0,
          unreadCount: 0,
          lastActivity: null
        }
      });
    } else if (url.includes('/messages') && method === 'GET') {
      res.status(200).json({
        success: true,
        data: {
          messages: [],
          pagination: { page: 1, limit: 50, total: 0, hasNext: false }
        }
      });
    } else if (url.includes('/messages') && method === 'POST') {
      res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        data: {
          messageId: 'demo-message-' + Date.now(),
          timestamp: new Date().toISOString()
        }
      });
    } else if (url.includes('/read') && method === 'POST') {
      res.status(200).json({
        success: true,
        message: 'Messages marked as read'
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Chat API working!',
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasDatabase: !!process.env.DATABASE_URL
        }
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};