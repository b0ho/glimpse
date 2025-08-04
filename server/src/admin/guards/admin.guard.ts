import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminService } from '../admin.service';

/**
 * 관리자 권한 Guard
 * 
 * 관리자 역할을 가진 사용자만 접근할 수 있도록 제한합니다.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly adminService: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.userId;

    if (!userId) {
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    const isAdmin = await this.adminService.isAdmin(userId);

    if (!isAdmin) {
      throw new UnauthorizedException('관리자 권한이 필요합니다.');
    }

    return true;
  }
}