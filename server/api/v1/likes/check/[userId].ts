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
      const { userId } = req.query;
      const { groupId } = req.query;

      // Simulate cooldown check logic
      const canLike = Math.random() > 0.2; // 80% can like
      const cooldownDays = canLike ? null : Math.floor(Math.random() * 14) + 1;

      return res.status(200).json({
        data: {
          canLike,
          cooldownDays,
          userId,
          groupId,
          lastLikeDate: canLike ? null : new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      });
    }

    return res.status(405).json({
      statusCode: 405,
      message: 'Method not allowed',
      allowedMethods: ['GET'],
    });

  } catch (error) {
    console.error('Check Like History API error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message || 'Unknown error',
    });
  }
}