import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';

/**
 * 매칭 컨트롤러
 * 
 * 매칭 목록 조회, 매칭 관리, 채팅 시작 등의 API를 제공합니다.
 */
@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  /**
   * 매칭 목록 조회
   * 
   * @param userId 현재 사용자 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 매칭 목록
   */
  @Get()
  async getMatches(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1', 10);
      const limitNum = parseInt(limit || '10', 10);

      const matches = await this.matchService.getMatches(
        userId,
        pageNum,
        limitNum,
      );

      return {
        success: true,
        data: matches,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '매칭 목록 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 매칭 통계 조회
   * 
   * @param userId 현재 사용자 ID
   * @returns 매칭 통계
   */
  @Get('stats')
  async getMatchStats(@CurrentUserId() userId: string) {
    try {
      const stats = await this.matchService.getMatchStats(userId);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '매칭 통계 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 매칭 상세 정보 조회
   * 
   * @param userId 현재 사용자 ID
   * @param matchId 매칭 ID
   * @returns 매칭 상세 정보
   */
  @Get(':matchId')
  async getMatch(
    @CurrentUserId() userId: string,
    @Param('matchId') matchId: string,
  ) {
    try {
      const match = await this.matchService.getMatchById(matchId, userId);
      return {
        success: true,
        data: match,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '매칭 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 채팅 시작
   * 
   * @param userId 현재 사용자 ID
   * @param matchId 매칭 ID
   * @returns 채팅 정보
   */
  @Post(':matchId/chat')
  async startChat(
    @CurrentUserId() userId: string,
    @Param('matchId') matchId: string,
  ) {
    try {
      const chat = await this.matchService.startChat(matchId, userId);
      return {
        success: true,
        data: {
          chatId: chat.id,
          matchId: matchId,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '채팅 시작에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 매칭 차단
   * 
   * @param userId 현재 사용자 ID
   * @param matchId 매칭 ID
   * @param body 차단 사유
   */
  @Post(':matchId/block')
  async blockMatch(
    @CurrentUserId() userId: string,
    @Param('matchId') matchId: string,
    @Body() body: { reason?: string },
  ) {
    try {
      await this.matchService.blockMatch(matchId, userId, body.reason);
      return {
        success: true,
        message: '매칭이 차단되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '매칭 차단에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
