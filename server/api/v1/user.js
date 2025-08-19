// v1 API 사용자 엔드포인트
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
    res.status(200).json({
      success: true,
      message: 'User API working!',
      data: {
        id: 'demo-user-1',
        nickname: 'demo_user',
        isVerified: true,
        isPremium: false,
        credits: 5
      },
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL
      }
    });
  } catch (error) {
    console.error('User API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};