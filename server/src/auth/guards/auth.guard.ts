import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

/**
 * 인증 가드
 *
 * JWT 토큰 또는 Clerk 토큰을 검증하여 요청을 인증합니다.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    try {
      const payload = await this.authService.verifyToken(token);

      if (!payload) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
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
