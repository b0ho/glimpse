import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 기본 라우팅
    const { url, method } = req;
    
    // Health check
    if (url === '/' || url === '/health') {
      return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        message: 'Glimpse API is running on Vercel',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          docs: '/api/docs',
          api: '/api/v1',
        },
      });
    }

    // API 문서 간단 버전
    if (url === '/docs') {
      return res.status(200).json({
        title: 'Glimpse API',
        version: '1.0.0',
        description: 'Privacy-focused Korean dating app API',
        endpoints: {
          health: 'GET /api/health',
          users: 'GET /api/v1/users',
          groups: 'GET /api/v1/groups',
          matches: 'GET /api/v1/matches',
        },
        status: 'Under Development - NestJS migration in progress',
      });
    }

    // 404 for other routes
    return res.status(404).json({
      statusCode: 404,
      message: 'Not Found',
      error: `Route ${method} ${url} not found`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}