import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 개발 환경에서는 항상 성공
    if (process.env.NODE_ENV === 'development') {
      const { email, password } = body;
      
      // 테스트 계정 체크
      if (email === 'admin@glimpse.app' && password === 'admin123!') {
        return NextResponse.json({
          success: true,
          message: '로그인 성공',
          user: {
            id: 'admin',
            email: 'admin@glimpse.app',
            role: 'admin'
          },
          token: 'dev-admin-token'
        });
      }
    }
    
    // 백엔드 API로 요청 전달 (실제 서버 주소로 변경)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';
    
    // 개발 모드 확인
    const useDevAuth = process.env.USE_DEV_AUTH === 'true' || process.env.NODE_ENV === 'development';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (useDevAuth) {
      headers['X-Dev-Auth'] = 'true';
    }
    
    const response = await fetch(`${backendUrl}/admin/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      // 성공 시 응답 반환
      return NextResponse.json(data);
    } else {
      // 에러 시 상태 코드와 함께 반환
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error('Admin login proxy error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}