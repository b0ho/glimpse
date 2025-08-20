import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminService } from '../admin.service';

/**
 * 관리자 권한 Guard
 *
 * 관리자 역할을 가진 사용자만 접근할 수 있도록 제한합니다.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = user?.id || user?.userId;

    // 개발 모드 확인
    const useDevAuth =
      this.configService.get<string>('USE_DEV_AUTH') === 'true';
    const devAuth = request.headers['x-dev-auth'];

    // 디버깅을 위한 로그
    console.log('[AdminGuard] Debug info:', {
      useDevAuth,
      devAuth,
      userRole: user?.role,
      userId,
      hasUser: !!user,
    });

    // 개발 모드에서 관리자 역할 확인
    if (useDevAuth && devAuth === 'true') {
      if (user?.role === 'admin') {
        console.log('[AdminGuard] Admin access granted in dev mode');
        return true;
      }
      console.log('[AdminGuard] Not admin role in dev mode:', user?.role);
    }

    if (!userId) {
      console.log('[AdminGuard] No userId found');
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    const isAdmin = await this.adminService.isAdmin(userId);
    console.log('[AdminGuard] isAdmin check result:', isAdmin);

    if (!isAdmin) {
      throw new UnauthorizedException('관리자 권한이 필요합니다.');
    }

    return true;
  }
}
