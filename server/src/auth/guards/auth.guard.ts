import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

/**
 * 인증 가드
 *
 * JWT 토큰 또는 Clerk 토큰을 검증하여 요청을 인증합니다.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    // 개발 모드 확인 - 운영 환경에서는 절대 허용하지 않음
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const useDevAuth =
      this.configService.get<string>('USE_DEV_AUTH') === 'true';

    // 운영 환경에서 개발 모드 사용 시 에러
    if (nodeEnv === 'production' && useDevAuth) {
      throw new UnauthorizedException(
        '운영 환경에서는 개발 모드를 사용할 수 없습니다.',
      );
    }

    // 개발 환경에서만 개발 모드 허용 (토큰이 없을 때만)
    if (nodeEnv === 'development' && useDevAuth && !token) {
      const devAuth = request.headers['x-dev-auth'];
      if (devAuth === 'true') {
        console.log('[AuthGuard] Dev mode auth in development environment (no token)');
        // 기본 사용자 설정 - 실제 DB의 첫 번째 사용자 사용
        request['user'] = {
          id: 'cmeh8afwr000i1mb7ikv3lq1a',
          email: 'user1@example.com',
          nickname: '북벌레1',
          role: 'user',
        };
        (request as any)['userId'] = 'cmeh8afwr000i1mb7ikv3lq1a';
        return true;
      }
    }

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    try {
      const payload = await this.authService.verifyToken(token);

      if (!payload) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      // 개발 모드에서 관리자 토큰 처리
      const devAuthHeader = request.headers['x-dev-auth'];
      if (useDevAuth && devAuthHeader === 'true' && payload.role === 'admin') {
        console.log('[AuthGuard] Admin token verified in dev mode:', payload.email);
        request['user'] = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          nickname: payload.name || '개발 관리자',
        };
        (request as any)['userId'] = payload.sub;
        return true;
      }

      // 개발 모드 사용자 토큰 처리
      if (
        useDevAuth &&
        devAuthHeader === 'true' &&
        payload.role === 'user' &&
        payload.userId
      ) {
        // userId로 사용자 찾기
        const user = await this.authService.findUserByClerkId(payload.userId);
        if (user) {
          request['user'] = user;
          (request as any)['userId'] = user.id;
          return true;
        }
      }

      // Clerk token verification
      if (payload.sub) {
        const user = await this.authService.findUserByClerkId(payload.sub);

        if (!user) {
          // Create user if not exists
          const newUser = await this.authService.createOrUpdateUser(
            payload.sub,
          );
          request['user'] = newUser;
        } else {
          request['user'] = user;

          // Update last active
          await this.authService.updateLastActive(user.id);
        }
      }
      // Legacy JWT token
      else if (payload.userId) {
        const user = await this.authService.findUserByClerkId(payload.userId);
        request['user'] = user || undefined;

        if (user) {
          await this.authService.updateLastActive(user.id);
        }
      } else {
        throw new UnauthorizedException('유효하지 않은 토큰 형식입니다.');
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('토큰 검증에 실패했습니다.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
