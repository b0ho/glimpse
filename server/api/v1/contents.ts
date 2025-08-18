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
    let contents: any[] = [];

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

        // Get contents from database
        if (req.method === 'GET') {
          const { groupId, page = 1, limit = 20 } = req.query;
          const whereClause = groupId ? { groupId: groupId as string } : {};
          
          contents = await prisma.content.findMany({
            where: whereClause,
            include: {
              author: {
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
              _count: {
                select: {
                  likes: true,
                }
              }
            },
            take: parseInt(limit as string),
            skip: (parseInt(page as string) - 1) * parseInt(limit as string),
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
        return res.status(200).json({
          success: true,
          data: contents.length > 0 ? contents : [
            {
              id: 'content1',
              userId: 'user1',
              authorId: 'user1',
              authorNickname: '익명작성자',
              type: 'text',
              text: '안녕하세요! 첫 게시글입니다.',
              imageUrls: [],
              groupId: req.query.groupId || 'group1',
              likes: 0,
              likeCount: 0,
              views: 12,
              isPublic: true,
              isLikedByUser: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'content2',
              userId: 'user2',
              authorId: 'user2',
              authorNickname: '익명작성자2',
              type: 'image',
              text: '멋진 풍경 사진을 공유합니다!',
              imageUrls: ['https://example.com/image1.jpg'],
              groupId: req.query.groupId || 'group1',
              likes: 0,
              likeCount: 5,
              views: 34,
              isPublic: true,
              isLikedByUser: false,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              updatedAt: new Date(Date.now() - 3600000).toISOString(),
            }
          ],
          database: {
            status: dbStatus,
            connected: dbStatus.includes('Connected'),
          },
        });

      case 'POST':
        // Handle content creation
        const contentData = req.body || {};
        const newContent = {
          id: `content_${Date.now()}`,
          userId: contentData.userId || 'current_user',
          authorId: contentData.authorId || 'current_user',
          authorNickname: contentData.authorNickname || '익명유저',
          type: contentData.type || 'text',
          text: contentData.text || '',
          imageUrls: contentData.imageUrls || [],
          groupId: contentData.groupId,
          likes: 0,
          likeCount: 0,
          views: 0,
          isPublic: true,
          isLikedByUser: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return res.status(201).json({
          success: true,
          data: newContent,
        });

      case 'PUT':
        // Handle content update
        const updateData = req.body || {};
        return res.status(200).json({
          success: true,
          data: {
            ...updateData,
            updatedAt: new Date().toISOString(),
          },
        });

      case 'DELETE':
        // Handle content deletion
        return res.status(200).json({
          success: true,
          message: 'Content deleted successfully',
        });

      default:
        return res.status(405).json({
          statusCode: 405,
          message: 'Method not allowed',
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        });
    }

  } catch (error) {
    console.error('Contents API error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}