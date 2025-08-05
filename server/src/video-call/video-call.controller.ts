import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { VideoCallService } from './video-call.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCallDto } from './dto/create-call.dto';
import { CallEventDto } from './dto/call-event.dto';

/**
 * 영상/음성 통화 컨트롤러
 *
 * WebRTC 기반 P2P 통화를 위한 API를 제공합니다.
 */
@Controller('video-call')
@UseGuards(JwtAuthGuard)
export class VideoCallController {
  constructor(private readonly videoCallService: VideoCallService) {}

  /**
   * 통화 시작
   *
   * @route POST /video-call/initiate
   */
  @Post('initiate')
  async initiateCall(@Req() req: any, @Body() data: CreateCallDto) {
    return this.videoCallService.initiateCall(req.user.id, data);
  }

  /**
   * 통화 이벤트 처리
   *
   * @route POST /video-call/event
   */
  @Post('event')
  async handleCallEvent(@Req() req: any, @Body() data: CallEventDto) {
    return this.videoCallService.handleCallEvent(req.user.id, data);
  }

  /**
   * TURN 서버 자격 증명 요청
   *
   * @route GET /video-call/turn-credentials
   */
  @Get('turn-credentials')
  async getTurnCredentials(@Req() req: any) {
    return this.videoCallService.getTurnCredentials(req.user.id);
  }

  /**
   * 활성 통화 목록 조회
   *
   * @route GET /video-call/active
   */
  @Get('active')
  async getActiveCalls(@Req() req: any) {
    return this.videoCallService.getActiveCalls(req.user.id);
  }

  /**
   * 통화 기록 조회
   *
   * @route GET /video-call/history
   */
  @Get('history')
  async getCallHistory(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.videoCallService.getCallHistory(req.user.id, limit, offset);
  }
}
