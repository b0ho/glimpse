// v1 API 인증 엔드포인트
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
    // 기본 인증 상태 응답 (실제 구현은 나중에)
    res.status(200).json({
      success: true,
      message: 'Auth API working!',
      data: {
        isAuthenticated: false,
        authMethod: 'production-ready'
      },
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        hasJWT: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    console.error('Auth API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};