import { NextRequest, NextResponse } from 'next/server';

// 개발 환경 인증 체크
function checkDevAuth(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const hasDevAuth = request.headers.get('x-dev-auth') === 'true';
  return isDev && hasDevAuth;
}

export async function GET(request: NextRequest) {
  // 개발 환경 인증 체크
  if (!checkDevAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // 서버 API 호출
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${serverUrl}/api/v1/admin/mismatches`, {
      headers: {
        'x-dev-auth': 'true',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    
    // 데이터 가공 및 통계 계산
    const mismatches = data.data || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total: mismatches.length,
      todayCount: mismatches.filter((m: any) => 
        new Date(m.mismatchedAt) >= today
      ).length,
      weekCount: mismatches.filter((m: any) => 
        new Date(m.mismatchedAt) >= weekAgo
      ).length,
      averageMessageCount: mismatches.length > 0
        ? mismatches.reduce((sum: number, m: any) => sum + (m.messageCount || 0), 0) / mismatches.length
        : 0,
    };

    // 데이터 형식 변환
    const formattedMismatches = mismatches.map((mismatch: any) => ({
      id: mismatch.id,
      user1: {
        id: mismatch.user1.id,
        nickname: mismatch.user1.nickname || '익명',
        phoneNumber: mismatch.user1.phoneNumber || '',
        profileImage: mismatch.user1.profileImage,
      },
      user2: {
        id: mismatch.user2.id,
        nickname: mismatch.user2.nickname || '익명',
        phoneNumber: mismatch.user2.phoneNumber || '',
        profileImage: mismatch.user2.profileImage,
      },
      group: {
        id: mismatch.group.id,
        name: mismatch.group.name,
        type: mismatch.group.type,
      },
      mismatchedBy: mismatch.mismatchedBy,
      mismatchedAt: mismatch.mismatchedAt,
      mismatchReason: mismatch.mismatchReason,
      originalMatchedAt: mismatch.createdAt,
      messageCount: mismatch._count?.messages || 0,
    }));

    return NextResponse.json({
      success: true,
      mismatches: formattedMismatches,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch mismatch data:', error);
    
    // 개발 환경에서는 목업 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        mismatches: [
          {
            id: 'mock-1',
            user1: {
              id: 'user1',
              nickname: '테스트유저1',
              phoneNumber: '010-1234-5678',
              profileImage: null,
            },
            user2: {
              id: 'user2',
              nickname: '테스트유저2',
              phoneNumber: '010-9876-5432',
              profileImage: null,
            },
            group: {
              id: 'group1',
              name: '테스트 그룹',
              type: 'OFFICIAL',
            },
            mismatchedBy: 'user1',
            mismatchedAt: new Date().toISOString(),
            mismatchReason: '잘못된 매칭입니다',
            originalMatchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            messageCount: 5,
          },
        ],
        stats: {
          total: 1,
          todayCount: 1,
          weekCount: 1,
          averageMessageCount: 5,
        },
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch mismatch data' },
      { status: 500 }
    );
  }
}