import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

/**
 * 관리자 전용 인증 가드
 *
 * 관리자용 DB 기반 JWT 토큰만을 검증합니다.
 * Admin 페이지 전용으로 사용됩니다.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    // 개발 모드 확인
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const useDevAuth =
      this.configService.get<string>('USE_DEV_AUTH') === 'true';

    // 운영 환경에서 개발 모드 사용 시 에러
    if (nodeEnv === 'production' && useDevAuth) {
      throw new UnauthorizedException(
        '운영 환경에서는 개발 모드를 사용할 수 없습니다.',
      );
    }

    if (!token) {
      throw new UnauthorizedException('관리자 인증 토큰이 필요합니다.');
    }

    try {
      // 개발 모드에서 dev-token 처리
      if (useDevAuth && token === 'dev-token') {
        const devAuth = request.headers['x-dev-auth'];
        if (devAuth === 'true') {
          console.log('[AdminAuthGuard] Admin dev token verified');
          request['user'] = {
            id: 'admin-dev-1',
            email: 'admin@glimpse.app',
            role: 'admin',
            nickname: '개발 관리자',
          };
          (request as any)['userId'] = 'admin-dev-1';
          return true;
        }
      }

      // JWT 토큰 검증 (Clerk가 아닌 직접 발급한 JWT만)
      let payload: any;
      
      try {
        // 자체 JWT 토큰 검증
        const secret = this.configService.get<string>(
          'JWT_SECRET',
          'default-secret',
        );
        payload = jwt.verify(token, secret);
      } catch (jwtError) {
        throw new UnauthorizedException('유효하지 않은 관리자 토큰입니다.');
      }

      // Admin 권한 확인
      if (payload.role !== 'admin') {
        throw new UnauthorizedException('관리자 권한이 필요합니다.');
      }

      // Clerk 토큰 거부 (sub 필드가 있으면 Clerk 토큰)
      if (payload.sub && !payload.sub.startsWith('admin')) {
        throw new UnauthorizedException('Clerk 토큰은 관리자 인증에 사용할 수 없습니다.');
      }

      request['user'] = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        nickname: payload.name || '관리자',
      };
      (request as any)['userId'] = payload.sub;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('관리자 토큰 검증에 실패했습니다.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}