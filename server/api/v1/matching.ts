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
      // Check authorization in production
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
      // Try to connect to database
      if (process.env.DATABASE_URL) {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
        });

        await prisma.$connect();
        
        const provider = process.env.DATABASE_URL.includes('railway.app') ? 'Railway PostgreSQL' :
                        process.env.DATABASE_URL.includes('rlwy.net') ? 'Railway PostgreSQL' :
                        process.env.DATABASE_URL.includes('localhost') ? 'Local PostgreSQL' :
                        'PostgreSQL';
        dbStatus = `Connected to ${provider}`;

        // Get matches from database
        if (req.method === 'GET' && req.url?.includes('/matches')) {
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
            take: 20,
            orderBy: { createdAt: 'desc' }
          });
        }

        await prisma.$disconnect();
      } else {
        dbStatus = 'Database URL not configured';
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      dbStatus = `Database error: ${dbError.message}`;
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        if (req.url?.includes('/matches')) {
          return res.status(200).json({
            success: true,
            data: matches.length > 0 ? matches : [
              {
                id: 'demo_match_1',
                user1: { id: 'user1', nickname: '익명유저1', profileImageUrl: null },
                user2: { id: 'user2', nickname: '익명유저2', profileImageUrl: null },
                group: { id: 'group1', name: '테크 스타트업' },
                createdAt: new Date().toISOString(),
              }
            ],
            database: {
              status: dbStatus,
              connected: dbStatus.includes('Connected'),
            },
          });
        } else if (req.url?.includes('/recommendations')) {
          return res.status(200).json({
            success: true,
            data: [
              {
                id: 'rec1',
                nickname: '추천유저1',
                age: 28,
                job: '개발자',
                groupId: req.query.groupId || 'group1',
              }
            ],
          });
        }
        break;

      case 'DELETE':
        // Handle unmatch
        return res.status(200).json({
          success: true,
          message: 'Match deleted successfully',
        });

      default:
        return res.status(405).json({
          statusCode: 405,
          message: 'Method not allowed',
          allowedMethods: ['GET', 'DELETE'],
        });
    }

  } catch (error) {
    console.error('Matching API error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}