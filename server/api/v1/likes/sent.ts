import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-auth');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Check dev auth for development
    const isDevMode = req.headers['x-dev-auth'] === 'true' || process.env.NODE_ENV === 'development';

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

    if (req.method === 'GET') {
      return res.status(200).json({
        data: [
          {
            id: 'sent_like_1',
            toUser: { 
              id: 'user3', 
              nickname: '익명유저3', 
              profileImageUrl: null 
            },
            group: { 
              id: 'group1', 
              name: '테크 스타트업' 
            },
            createdAt: new Date().toISOString(),
            isSuper: false,
          },
          {
            id: 'sent_like_2',
            toUser: { 
              id: 'user4', 
              nickname: '익명유저4', 
              profileImageUrl: null 
            },
            group: { 
              id: 'group2', 
              name: '커피 애호가들' 
            },
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            isSuper: true,
          }
        ]
      });
    }

    return res.status(405).json({
      statusCode: 405,
      message: 'Method not allowed',
      allowedMethods: ['GET'],
    });

  } catch (error) {
    console.error('Sent Likes API error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message || 'Unknown error',
    });
  }
}