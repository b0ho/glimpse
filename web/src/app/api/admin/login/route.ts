import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 백엔드 API로 요청 전달
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${backendUrl}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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