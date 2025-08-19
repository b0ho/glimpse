// 통합 API 라우터 - 여러 엔드포인트를 하나의 파일에서 처리
module.exports = async (req, res) => {
  console.log('Router called:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-auth');
  res.setHeader('Content-Type', 'application/json');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    
    // /api/v1/users 경로 처리
    if (url.includes('users')) {
      if (url.includes('/profile') && method === 'GET') {
        res.status(200).json({
          success: true,
          data: {
            id: 'demo-user-' + Date.now(),
            email: 'demo@example.com',
            nickname: 'Demo User',
            age: 28,
            isVerified: true,
            isPremium: false,
            credits: 5
          }
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Users API working via router!',
          timestamp: new Date().toISOString()
        });
      }
      return;
    }
    
    // /api/v1/matching 경로 처리
    if (url.includes('matching')) {
      if (url.includes('/likes') && method === 'GET') {
        res.status(200).json({
          success: true,
          data: {
            likes: [],
            pagination: { page: 1, limit: 20, total: 0, hasNext: false }
          }
        });
      } else if (method === 'POST') {
        res.status(200).json({
          success: true,
          message: 'Like sent successfully',
          data: { likeId: 'demo-like-' + Date.now(), isMatch: false }
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Matching API working via router!',
          timestamp: new Date().toISOString()
        });
      }
      return;
    }
    
    // /api/v1/chat 경로 처리
    if (url.includes('chat')) {
      res.status(200).json({
        success: true,
        message: 'Chat API working via router!',
        data: { rooms: [], unreadCount: 0 },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 기본 응답
    res.status(200).json({
      success: true,
      message: 'API Router working!',
      availableEndpoints: ['/users', '/matching', '/chat'],
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        hasEncryption: !!process.env.ENCRYPTION_KEY
      }
    });

  } catch (error) {
    console.error('Router error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};