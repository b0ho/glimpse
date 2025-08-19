// 다중 API 라우터로 확장된 엔드포인트
const express = require('express');

module.exports = async (req, res) => {
  console.log('Multi API endpoint called:', {
    method: req.method,
    url: req.url,
    query: req.query
  });

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-auth');
  res.setHeader('Content-Type', 'application/json');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    const query = req.query || {};
    
    // API 타입 파라미터로 라우팅 처리
    if (query.api === 'users') {
      res.status(200).json({
        success: true,
        message: 'Users API working via simple endpoint!',
        data: {
          id: 'demo-user-' + Date.now(),
          nickname: 'Demo User',
          isVerified: true,
          isPremium: false,
          credits: 5
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    if (query.api === 'matching') {
      res.status(200).json({
        success: true,
        message: 'Matching API working via simple endpoint!',
        data: {
          likes: [],
          matches: [],
          recommendations: []
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    if (query.api === 'chat') {
      res.status(200).json({
        success: true,
        message: 'Chat API working via simple endpoint!',
        data: {
          rooms: [],
          unreadCount: 0
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    if (query.api === 'contents') {
      res.status(200).json({
        success: true,
        message: 'Contents API working via simple endpoint!',
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
            }
          ],
          pagination: { page: 1, limit: 20, total: 2, hasNext: false }
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 기본 simple 응답 (DB 연결 테스트 포함)
    let dbTest = 'not-tested';
    try {
      if (process.env.DATABASE_URL) {
        dbTest = 'connection-string-exists';
      }
    } catch (error) {
      dbTest = 'connection-failed: ' + error.message;
    }

    res.status(200).json({
      status: 'success',
      message: 'Multi API Simple endpoint working!',
      availableAPIs: {
        users: '/api/simple?api=users',
        matching: '/api/simple?api=matching',
        chat: '/api/simple?api=chat',
        contents: '/api/simple?api=contents'
      },
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        hasEncryption: !!process.env.ENCRYPTION_KEY,
        hasJWT: !!process.env.JWT_SECRET,
        platform: 'vercel-serverless'
      },
      dbTest: dbTest,
      cors: 'enabled'
    });

  } catch (error) {
    console.error('Multi API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};