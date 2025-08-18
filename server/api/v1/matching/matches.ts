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

    // Database connection check
    let dbStatus = 'Not connected';
    let matches: any[] = [];

    try {
      if (process.env.DATABASE_URL) {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
        });

        await prisma.$connect();
        dbStatus = `Connected to Railway PostgreSQL`;

        if (req.method === 'GET') {
          matches = await prisma.match.findMany({
            include: {
              user1: {
                select: {
                  id: true,
                  nickname: true,
                  profileImageUrl: true,
                }
              },
              user2: {
                select: {
                  id: true,
                  nickname: true,
                  profileImageUrl: true,
                }
              },
              group: {
                select: {
                  id: true,
                  name: true,
                }
              },
            },
            take: parseInt(req.query.limit as string) || 20,
            orderBy: { createdAt: 'desc' }
          });
        }

        await prisma.$disconnect();
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      dbStatus = `Database error: ${dbError.message}`;
    }

    switch (req.method) {
      case 'GET':
        return res.status(200).json({
          success: true,
          data: matches.length > 0 ? matches : [
            {
              id: 'demo_match_1',
              user1: { id: 'user1', nickname: '익명유저1', profileImageUrl: null },
              user2: { id: 'user2', nickname: '익명유저2', profileImageUrl: null },
              group: { id: 'group1', name: '테크 스타트업' },
              createdAt: new Date().toISOString(),
              isActive: true,
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
    console.error('Matches API error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message || 'Unknown error',
    });
  }
}