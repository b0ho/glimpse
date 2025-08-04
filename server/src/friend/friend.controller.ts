import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FriendService } from './friend.service';
import { AuthGuard } from '../auth/auth.guard';

/**
 * 친구 관리 컨트롤러
 */
@ApiTags('friends')
@Controller('friends')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  /**
   * 친구 요청 목록 조회
   */
  @Get('requests')
  @ApiOperation({ summary: '친구 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '친구 요청 목록' })
  async getFriendRequests(
    @Req() req: any,
    @Query('status') status?: string
  ) {
    const userId = req.user.id;
    const data = await this.friendService.getFriendRequests(userId, status);
    return { success: true, data };
  }

  /**
   * 친구 요청 전송
   */
  @Post('requests')
  @ApiOperation({ summary: '친구 요청 전송' })
  @ApiResponse({ status: 201, description: '친구 요청 전송됨' })
  async sendFriendRequest(
    @Req() req: any,
    @Body() body: { toUserId: string; message?: string }
  ) {
    const userId = req.user.id;
    const data = await this.friendService.sendFriendRequest(
      userId,
      body.toUserId,
      body.message
    );
    return { success: true, data };
  }

  /**
   * 친구 요청 수락
   */
  @Post('requests/:requestId/accept')
  @ApiOperation({ summary: '친구 요청 수락' })
  @ApiResponse({ status: 200, description: '친구 요청 수락됨' })
  async acceptFriendRequest(
    @Req() req: any,
    @Param('requestId') requestId: string
  ) {
    const userId = req.user.id;
    const data = await this.friendService.acceptFriendRequest(requestId, userId);
    return { success: true, data };
  }

  /**
   * 친구 요청 거절
   */
  @Post('requests/:requestId/reject')
  @ApiOperation({ summary: '친구 요청 거절' })
  @ApiResponse({ status: 200, description: '친구 요청 거절됨' })
  async rejectFriendRequest(
    @Req() req: any,
    @Param('requestId') requestId: string
  ) {
    const userId = req.user.id;
    const result = await this.friendService.rejectFriendRequest(requestId, userId);
    return result;
  }

  /**
   * 친구 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '친구 목록 조회' })
  @ApiResponse({ status: 200, description: '친구 목록' })
  async getFriends(@Req() req: any) {
    const userId = req.user.id;
    const data = await this.friendService.getFriends(userId);
    return { success: true, data };
  }

  /**
   * 친구 삭제
   */
  @Delete(':friendId')
  @ApiOperation({ summary: '친구 삭제' })
  @ApiResponse({ status: 200, description: '친구 삭제됨' })
  async removeFriend(
    @Req() req: any,
    @Param('friendId') friendId: string
  ) {
    const userId = req.user.id;
    const result = await this.friendService.removeFriend(userId, friendId);
    return result;
  }
}