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
    let groups: any[] = [];

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

        // Get groups from database
        if (req.method === 'GET') {
          groups = await prisma.group.findMany({
            include: {
              _count: {
                select: {
                  members: true,
                  likes: true,
                },
              },
            },
            take: 20,
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
        return res.status(200).json({
          success: true,
          data: groups.length > 0 ? groups : [
            {
              id: 'demo1',
              name: '테크 스타트업',
              description: '기술 기업에서 일하는 사람들의 모임',
              type: 'OFFICIAL',
              memberCount: 45,
              isActive: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'demo2', 
              name: '커피 애호가들',
              description: '커피를 사랑하는 사람들의 소통 공간',
              type: 'CREATED',
              memberCount: 28,
              isActive: true,
              createdAt: new Date().toISOString(),
            },
          ],
          database: {
            status: dbStatus,
            connected: dbStatus.includes('Connected'),
          },
          pagination: {
            total: groups.length || 2,
            page: 1,
            limit: 20,
          },
          timestamp: new Date().toISOString(),
        });

      case 'POST':
        return res.status(201).json({
          success: true,
          message: 'Group creation would be handled here',
          database: {
            status: dbStatus,
          },
        });

      default:
        return res.status(405).json({
          statusCode: 405,
          message: 'Method not allowed',
          allowedMethods: ['GET', 'POST'],
        });
    }

  } catch (error) {
    console.error('Groups API error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}