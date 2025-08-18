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
        data: {
          dailyUsed: 5,
          dailyLimit: 10,
          premiumLikes: 3,
          lastReset: new Date().toISOString().split('T')[0], // Today's date
          nextReset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        }
      });
    }

    return res.status(405).json({
      statusCode: 405,
      message: 'Method not allowed',
      allowedMethods: ['GET'],
    });

  } catch (error) {
    console.error('Like Status API error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message || 'Unknown error',
    });
  }
}