import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인 (실제 구현에서는 더 안전한 방법 사용)
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    // 기본 통계 정보 수집
    const stats = await Promise.all([
      // 총 사용자 수
      prisma.user.count(),
      
      // 활성 사용자 수 (지난 7일 내 활동)
      prisma.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // 총 매치 수
      prisma.match.count(),
      
      // 총 메시지 수 (실제 구현에서는 Message 모델 존재 시 사용)
      // prisma.message.count(),
      Math.floor(Math.random() * 10000 + 5000), // 임시 더미 데이터
      
      // 프리미엄 사용자 수
      prisma.user.count({
        where: {
          isPremium: true,
        },
      }),
      
      // 오늘 신규 가입자
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // 매출 계산 (더미 데이터 - 실제로는 Payment 테이블에서 계산)
    const revenue = stats[4] * 9900; // 프리미엄 사용자 수 * 월 구독료

    // 시스템 성능 메트릭 (더미 데이터)
    const systemMetrics = {
      cpuUsage: Math.round(Math.random() * 30 + 10), // 10-40%
      memoryUsage: Math.round(Math.random() * 20 + 60), // 60-80%
      diskUsage: Math.round(Math.random() * 10 + 45), // 45-55%
      activeConnections: Math.round(Math.random() * 200 + 100), // 100-300
      responseTime: Math.round(Math.random() * 100 + 50), // 50-150ms
    };

    return NextResponse.json({
      stats: {
        totalUsers: stats[0],
        activeUsers: stats[1],
        totalMatches: stats[2],
        totalMessages: stats[3],
        premiumUsers: stats[4],
        newUsersToday: stats[5],
        revenue,
        onlineUsers: Math.round(stats[1] * 0.1), // 활성 사용자의 10%가 온라인
      },
      systemMetrics,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: '통계 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}