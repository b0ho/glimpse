// v1 API 경로의 컨텐츠 엔드포인트 (groups.js를 복사해서 수정)
module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-auth');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    res.status(200).json({
      success: true,
      message: 'Contents API working! (copied from groups)',
      data: {
        stories: [
          {
            id: 'story-1',
            userId: 'user-1',
            nickname: 'Demo User',
            imageUrl: 'https://picsum.photos/400/600?random=1',
            caption: 'Beautiful sunset today! 🌅',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
            viewCount: 15,
            isViewed: false
          },
          {
            id: 'story-2',
            userId: 'user-2',
            nickname: 'Coffee Lover',
            imageUrl: 'https://picsum.photos/400/600?random=2',
            caption: 'Perfect coffee morning ☕',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
            viewCount: 8,
            isViewed: true
          }
        ],
        feeds: [
          {
            id: 'feed-1',
            type: 'GROUP_ACTIVITY',
            title: '새로운 그룹 멤버가 가입했습니다',
            content: '카카오 그룹에 5명의 새로운 멤버가 가입했습니다.',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            isRead: false
          },
          {
            id: 'feed-2',
            type: 'MATCH_UPDATE',
            title: '새로운 매치가 생겼습니다',
            content: '축하합니다! 새로운 매치가 생성되었습니다.',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            isRead: true
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 4,
          hasNext: false
        }
      },
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL
      }
    });
  } catch (error) {
    console.error('Contents API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};