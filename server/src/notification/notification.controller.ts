import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(ClerkAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 알림 목록 조회
   */
  @Get()
  async getNotifications(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '20', 10);

    // 임시 데이터 반환 (NotificationService의 메서드가 구현되면 실제 데이터로 교체)
    return {
      success: true,
      data: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
      },
    };
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUserId() userId: string) {
    return {
      success: true,
      data: {
        count: 0,
      },
    };
  }

  /**
   * 알림 읽음 처리
   */
  @Patch(':notificationId/read')
  async markAsRead(
    @CurrentUserId() userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return {
      success: true,
      message: '알림이 읽음 처리되었습니다.',
    };
  }

  /**
   * 모든 알림 읽음 처리
   */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUserId() userId: string) {
    return {
      success: true,
      message: '모든 알림이 읽음 처리되었습니다.',
    };
  }
}
