import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * 테스트 환경용 인증 가드
 * x-dev-auth: true 헤더가 있으면 인증 통과
 */
@Injectable()
export class TestAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 개발/테스트 환경에서만 동작
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    
    // x-dev-auth 헤더 체크
    if (request.headers['x-dev-auth'] === 'true') {
      // 테스트용 사용자 정보 설정
      request.user = {
        id: 'test-user-id',
        phoneNumber: '+821012345678',
        nickname: 'Test User',
        isPremium: false,
        credits: 10,
      };
      return true;
    }
    
    return false;
  }
}