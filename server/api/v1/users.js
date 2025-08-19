// v1 API 사용자 엔드포인트 (실제 NestJS와 동일한 응답 구조)
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
    
    if (url.includes('/profile') && method === 'GET') {
      res.status(200).json({
        success: true,
        data: {
          id: 'demo-user-' + Date.now(),
          email: 'demo@example.com',
          nickname: 'Demo User',
          age: 28,
          gender: 'MALE',
          isVerified: true,
          isPremium: false,
          credits: 5,
          profileImages: [],
          bio: 'Hello from production!',
          interests: [],
          workplace: null,
          location: null,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        }
      });
    } else if (url.includes('/profile') && method === 'PUT') {
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: 'demo-user-updated',
          message: 'Profile update completed'
        }
      });
    } else if (url.includes('/recommendations') && method === 'GET') {
      res.status(200).json({
        success: true,
        data: {
          users: [],
          hasMore: false
        }
      });
    } else if (url.includes('/stats') && method === 'GET') {
      res.status(200).json({
        success: true,
        data: {
          totalLikes: 0,
          totalMatches: 0,
          profileViews: 0,
          creditsRemaining: 5
        }
      });
    } else if (url.includes('/likes/remaining') && method === 'GET') {
      res.status(200).json({
        success: true,
        data: {
          dailyLikes: 1,
          credits: 5,
          isPremium: false
        }
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Users API working!',
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasDatabase: !!process.env.DATABASE_URL
        }
      });
    }
  } catch (error) {
    console.error('Users API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};