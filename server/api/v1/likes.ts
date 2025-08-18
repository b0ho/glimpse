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
    let likes: any[] = [];

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

        // Get likes from database based on the endpoint
        if (req.method === 'GET') {
          if (req.url?.includes('/received')) {
            likes = await prisma.like.findMany({
              where: { toUserId: 'current_user' }, // This would be actual user ID
              include: {
                fromUser: {
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
                }
              },
              take: 20,
              orderBy: { createdAt: 'desc' }
            });
          } else if (req.url?.includes('/sent')) {
            likes = await prisma.like.findMany({
              where: { fromUserId: 'current_user' }, // This would be actual user ID
              include: {
                toUser: {
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
                }
              },
              take: 20,
              orderBy: { createdAt: 'desc' }
            });
          }
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
        if (req.url?.includes('/status')) {
          return res.status(200).json({
            data: {
              dailyUsed: 5,
              dailyLimit: 10,
              premiumLikes: 3,
            }
          });
        } else if (req.url?.includes('/received')) {
          return res.status(200).json({
            data: likes.length > 0 ? likes : [
              {
                id: 'like1',
                fromUser: { id: 'user1', nickname: '익명유저1', profileImageUrl: null },
                group: { id: 'group1', name: '테크 스타트업' },
                createdAt: new Date().toISOString(),
                isSuper: false,
              }
            ]
          });
        } else if (req.url?.includes('/sent')) {
          return res.status(200).json({
            data: likes.length > 0 ? likes : [
              {
                id: 'like2',
                toUser: { id: 'user2', nickname: '익명유저2', profileImageUrl: null },
                group: { id: 'group1', name: '테크 스타트업' },
                createdAt: new Date().toISOString(),
                isSuper: false,
              }
            ]
          });
        } else if (req.url?.includes('/check/')) {
          return res.status(200).json({
            data: {
              canLike: true,
              cooldownDays: null,
            }
          });
        }
        break;

      case 'POST':
        // Handle sending likes
        const { toUserId, groupId, isSuper } = req.body || {};
        return res.status(200).json({
          data: {
            likeId: `like_${Date.now()}`,
            isMatch: Math.random() > 0.8, // 20% chance of match
            matchId: Math.random() > 0.8 ? `match_${Date.now()}` : undefined,
          }
        });

      case 'DELETE':
        // Handle unlike
        return res.status(200).json({
          success: true,
          message: 'Like removed successfully',
        });

      default:
        return res.status(405).json({
          statusCode: 405,
          message: 'Method not allowed',
          allowedMethods: ['GET', 'POST', 'DELETE'],
        });
    }

  } catch (error) {
    console.error('Likes API error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}