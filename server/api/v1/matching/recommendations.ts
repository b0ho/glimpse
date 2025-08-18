import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-auth');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Check dev auth for development
    const isDevMode = req.headers['x-dev-auth'] === 'true' || 
                     process.env.NODE_ENV === 'development';

    if (!isDevMode) {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Bearer token required',
        });
      }
    }

    switch (req.method) {
      case 'GET':
        const { groupId, page = 1, limit = 10 } = req.query;
        
        return res.status(200).json({
          success: true,
          data: [
            {
              id: 'rec1',
              nickname: '추천유저1',
              age: 28,
              job: '개발자',
              interests: ['카페', '독서', '영화'],
              groupId: groupId || 'group1',
              profileImageUrl: null,
              lastActive: new Date().toISOString(),
            },
            {
              id: 'rec2', 
              nickname: '추천유저2',
              age: 26,
              job: '디자이너',
              interests: ['여행', '사진', '음악'],
              groupId: groupId || 'group1',
              profileImageUrl: null,
              lastActive: new Date(Date.now() - 3600000).toISOString(),
            }
          ],
        });

      default:
        return res.status(405).json({
          statusCode: 405,
          message: 'Method not allowed',
          allowedMethods: ['GET'],
        });
    }

  } catch (error) {
    console.error('Recommendations API error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message || 'Unknown error',
    });
  }
}