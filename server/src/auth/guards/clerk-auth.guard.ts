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
 * Clerk 전용 인증 가드
 *
 * 일반 사용자용 Clerk JWT 토큰만을 검증합니다.
 * 모바일 앱 전용으로 사용됩니다.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
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
        console.log(
          '[ClerkAuthGuard] Dev mode auth in development environment (no token)',
        );
        // 기본 사용자 설정 - 실제 DB의 개발용 사용자 사용
        request['user'] = {
          id: 'cmeh8afwr000i1mb7ikv3lq1a',
          phoneNumber: '01012345678',
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

      // Clerk token만 허용 (sub 필드가 있어야 함)
      if (!payload.sub) {
        throw new UnauthorizedException('Clerk 토큰이 아닙니다.');
      }

      // Admin 토큰 거부
      if (payload.role === 'admin') {
        throw new UnauthorizedException('관리자 토큰은 사용할 수 없습니다.');
      }

      const user = await this.authService.findUserByClerkId(payload.sub);

      if (!user) {
        // Create user if not exists
        const newUser = await this.authService.createOrUpdateUser(payload.sub);
        request['user'] = newUser;
        (request as any)['userId'] = newUser.id;
      } else {
        request['user'] = user;
        (request as any)['userId'] = user.id;

        // Update last active
        await this.authService.updateLastActive(user.id);
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Clerk 토큰 검증에 실패했습니다.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
