// v1 API 매칭/좋아요 엔드포인트 (실제 NestJS와 동일한 응답 구조)
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
    // 경로별로 다른 응답 제공
    const { url, method } = req;
    
    if (url.includes('/likes/sent') && method === 'GET') {
      res.status(200).json({
        success: true,
        data: {
          likes: [],
          pagination: { page: 1, limit: 20, total: 0, hasNext: false }
        }
      });
    } else if (url.includes('/likes/received') && method === 'GET') {
      res.status(200).json({
        success: true,
        data: {
          likes: [],
          pagination: { page: 1, limit: 20, total: 0, hasNext: false }
        }
      });
    } else if (url.includes('/matches') && method === 'GET') {
      res.status(200).json({
        success: true,
        data: {
          matches: [],
          pagination: { page: 1, limit: 20, total: 0, hasNext: false }
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
    } else if (method === 'POST') {
      res.status(200).json({
        success: true,
        message: 'Like sent successfully',
        data: {
          likeId: 'demo-like-' + Date.now(),
          isMatch: false
        }
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Matching API working!',
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasDatabase: !!process.env.DATABASE_URL
        }
      });
    }
  } catch (error) {
    console.error('Matching API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};