import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 관리자 페이지 보호
  if (pathname.startsWith('/admin')) {
    // 로그인 페이지는 예외
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // 관리자 토큰 확인 (실제로는 더 안전한 방법 사용)
    const adminToken = request.cookies.get('admin_token')?.value;
    
    if (!adminToken) {
      // 관리자 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // 실제 구현에서는 토큰 검증 로직 추가
    // JWT 토큰 검증, 만료 시간 확인 등
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};