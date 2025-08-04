import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import {
  BanUserDto,
  ModerateGroupDto,
  HandleReportDto,
  GetStatsQueryDto,
  GetUsersQueryDto,
  CreateAnnouncementDto,
  ManageGroupDto,
  BroadcastNotificationDto,
  UserListQueryDto,
} from './dto/admin.dto';

/**
 * 관리자 컨트롤러
 * 
 * 관리자 전용 API를 제공합니다.
 */
@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 대시보드 통계 조회
   */
  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /**
   * 사용자 목록 조회
   */
  @Get('users')
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  /**
   * 사용자 상세 정보 조회
   */
  @Get('users/:userId')
  async getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  /**
   * 사용자 차단
   */
  @Post('users/:userId/ban')
  @HttpCode(HttpStatus.OK)
  async banUser(
    @Param('userId') userId: string,
    @CurrentUserId() adminId: string,
    @Body() data: BanUserDto,
  ) {
    await this.adminService.banUser(userId, adminId, data);
    return { success: true };
  }

  /**
   * 사용자 차단 해제
   */
  @Post('users/:userId/unban')
  @HttpCode(HttpStatus.OK)
  async unbanUser(
    @Param('userId') userId: string,
    @CurrentUserId() adminId: string,
  ) {
    await this.adminService.unbanUser(userId, adminId);
    return { success: true };
  }

  /**
   * 신고 목록 조회 (알림으로 대체)
   */
  @Get('reports')
  async getReports(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    // 신고 기능은 알림으로 대체되었으므로 Report 타입의 알림 조회
    const where: any = {
      title: { contains: 'Report' },
    };
    if (status === 'pending') {
      where.isRead = false;
    }
    return {
      items: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }

  /**
   * 신고 처리
   */
  @Post('reports/:reportId/handle')
  @HttpCode(HttpStatus.OK)
  async handleReport(
    @Param('reportId') reportId: string,
    @CurrentUserId() adminId: string,
    @Body() data: HandleReportDto,
  ) {
    // HandleReportDto의 action을 'approve' | 'reject'로 변환
    const action = data.action === 'BLOCK' ? 'approve' : 'reject';
    await this.adminService.handleReport(reportId, adminId, action);
    return { success: true };
  }

  /**
   * 그룹 목록 조회
   */
  @Get('groups')
  async getGroups(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    // 그룹 목록은 구현 필요
    return {
      items: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }

  /**
   * 그룹 승인/거절
   */
  @Post('groups/:groupId/moderate')
  @HttpCode(HttpStatus.OK)
  async moderateGroup(
    @Param('groupId') groupId: string,
    @CurrentUserId() adminId: string,
    @Body() data: ModerateGroupDto,
  ) {
    // ModerateGroupDto를 ManageGroupDto 형식으로 변환
    const manageData = {
      action: data.action === 'APPROVE' ? 'approve' as const : 'deactivate' as const,
      reason: data.reason,
    };
    await this.adminService.manageGroup(groupId, adminId, manageData);
    return { success: true };
  }

  /**
   * 공지사항 생성
   */
  @Post('announcements')
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(
    @CurrentUserId() adminId: string,
    @Body() data: CreateAnnouncementDto,
  ) {
    // 공지사항을 브로드캐스트 알림으로 변환
    const broadcastData = {
      title: data.title,
      message: data.content,
      targetAudience: 'all' as const,
    };
    return this.adminService.sendBroadcastNotification(adminId, broadcastData);
  }

  /**
   * 시스템 통계 조회
   */
  @Get('stats')
  async getSystemStats(@Query() query: GetStatsQueryDto) {
    // 대시보드 통계로 대체
    return this.adminService.getDashboardStats();
  }
}