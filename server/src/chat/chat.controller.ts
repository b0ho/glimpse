import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import {
  SendMessageDto,
  MessageReactionDto,
  SearchMessagesDto,
  SetTypingStatusDto,
  PaginationQueryDto,
} from './dto/chat.dto';

/**
 * 채팅 컨트롤러
 * 
 * 채팅 관련 API 엔드포인트를 제공합니다.
 * 메시지 송수신, 읽음 처리, 타이핑 상태 등을 관리합니다.
 */
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * 채팅 목록 요약 조회
   */
  @Get('summary')
  async getChatSummary(
    @CurrentUserId() userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { page = 1, limit = 20 } = query;
    return this.chatService.getChatSummary(userId, page, limit);
  }

  /**
   * 특정 매치의 메시지 목록 조회
   */
  @Get('match/:matchId/messages')
  async getMessages(
    @Param('matchId') matchId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { page = 1, limit = 50 } = query;
    return this.chatService.getMessages(matchId, page, limit);
  }

  /**
   * 메시지 전송
   */
  @Post('match/:matchId/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('matchId') matchId: string,
    @CurrentUserId() userId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(matchId, userId, sendMessageDto);
  }

  /**
   * 모든 메시지를 읽음으로 표시
   */
  @Post('match/:matchId/read')
  @HttpCode(HttpStatus.OK)
  async markAllMessagesAsRead(
    @Param('matchId') matchId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.chatService.markAllMessagesAsRead(matchId, userId);
  }

  /**
   * 메시지 통계 조회
   */
  @Get('match/:matchId/stats')
  async getMessageStats(@Param('matchId') matchId: string) {
    return this.chatService.getMessageStats(matchId);
  }

  /**
   * 메시지 검색
   */
  @Post('match/:matchId/search')
  async searchMessages(
    @Param('matchId') matchId: string,
    @Body() searchDto: SearchMessagesDto,
  ) {
    return this.chatService.searchMessages(matchId, searchDto);
  }

  /**
   * 메시지 반응 추가/제거
   */
  @Post('message/:messageId/reaction')
  @HttpCode(HttpStatus.OK)
  async toggleMessageReaction(
    @Param('messageId') messageId: string,
    @CurrentUserId() userId: string,
    @Body() reactionDto: MessageReactionDto,
  ) {
    return this.chatService.toggleMessageReaction(messageId, userId, reactionDto);
  }

  /**
   * 타이핑 상태 설정
   */
  @Post('match/:matchId/typing')
  @HttpCode(HttpStatus.OK)
  async setTypingStatus(
    @Param('matchId') matchId: string,
    @CurrentUserId() userId: string,
    @Body() statusDto: SetTypingStatusDto,
  ) {
    return this.chatService.setTypingStatus(matchId, userId, statusDto);
  }

  /**
   * 타이핑 중인 사용자 목록 조회
   */
  @Get('match/:matchId/typing')
  async getTypingUsers(@Param('matchId') matchId: string) {
    return this.chatService.getTypingUsers(matchId);
  }

  /**
   * 채팅 백업 생성
   */
  @Post('match/:matchId/backup')
  async generateChatBackup(
    @Param('matchId') matchId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.chatService.generateChatBackup(matchId, userId);
  }
}
