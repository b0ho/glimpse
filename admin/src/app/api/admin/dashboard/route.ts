import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // 쿠키에서 토큰 가져오기
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 개발 모드 확인
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${adminToken.value}`,
      'Content-Type': 'application/json',
    };
    
    if (isDevelopment) {
      headers['x-dev-auth'] = 'true';
    }

    // Railway 백엔드 API로 요청 전달
    const backendUrl = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 
                      (isDevelopment ? 'http://localhost:3001' : 'https://glimpse-server.up.railway.app');
    const response = await fetch(`${backendUrl}/api/v1/admin/dashboard`, {
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { message: 'Failed to fetch dashboard data' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}