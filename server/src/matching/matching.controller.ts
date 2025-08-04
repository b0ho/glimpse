import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MatchingService } from './matching.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import {
  CreateLikeDto,
  CreateSuperLikeDto,
  GetMatchesQueryDto,
  UnmatchDto,
} from './dto/matching.dto';

/**
 * 매칭 컨트롤러
 * 
 * 좋아요, 매칭, 추천 관련 API를 제공합니다.
 */
@Controller('matching')
@UseGuards(AuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /**
   * 좋아요 보내기
   */
  @Post('likes')
  @HttpCode(HttpStatus.CREATED)
  async createLike(
    @CurrentUserId() userId: string,
    @Body() createLikeDto: CreateLikeDto,
  ) {
    return this.matchingService.createLike(userId, createLikeDto);
  }

  /**
   * 슈퍼 좋아요 보내기 (프리미엄)
   */
  @Post('super-likes')
  @HttpCode(HttpStatus.CREATED)
  async createSuperLike(
    @CurrentUserId() userId: string,
    @Body() createSuperLikeDto: CreateSuperLikeDto,
  ) {
    return this.matchingService.createSuperLike(userId, createSuperLikeDto);
  }

  /**
   * 좋아요 취소
   */
  @Delete('likes/:likeId')
  async cancelLike(
    @Param('likeId') likeId: string,
    @CurrentUserId() userId: string,
  ) {
    await this.matchingService.cancelLike(likeId, userId);
    return { success: true };
  }

  /**
   * 보낸 좋아요 목록 조회
   */
  @Get('likes/sent')
  async getSentLikes(
    @CurrentUserId() userId: string,
    @Query() query: GetMatchesQueryDto,
  ) {
    const { groupId, page = 1, limit = 20 } = query;
    return this.matchingService.getSentLikes(userId, groupId, page, limit);
  }

  /**
   * 받은 좋아요 목록 조회 (프리미엄)
   */
  @Get('likes/received')
  async getReceivedLikes(
    @CurrentUserId() userId: string,
    @Query() query: GetMatchesQueryDto,
  ) {
    const { groupId, page = 1, limit = 20 } = query;
    return this.matchingService.getReceivedLikes(userId, groupId, page, limit);
  }

  /**
   * 매치 목록 조회
   */
  @Get('matches')
  async getMatches(
    @CurrentUserId() userId: string,
    @Query() query: GetMatchesQueryDto,
  ) {
    const { groupId, page = 1, limit = 20 } = query;
    return this.matchingService.getUserMatches(userId, groupId, page, limit);
  }

  /**
   * 매치 상세 정보 조회
   */
  @Get('matches/:matchId')
  async getMatchById(
    @Param('matchId') matchId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.matchingService.getMatchById(matchId, userId);
  }

  /**
   * 매치 해제
   */
  @Delete('matches/:matchId')
  async unmatch(
    @Param('matchId') matchId: string,
    @CurrentUserId() userId: string,
    @Body() unmatchDto: UnmatchDto,
  ) {
    await this.matchingService.unmatch(matchId, userId, unmatchDto.reason);
    return { success: true };
  }

  /**
   * 매칭 추천 목록 조회
   */
  @Get('recommendations')
  async getRecommendations(
    @CurrentUserId() userId: string,
    @Query('groupId') groupId: string,
    @Query('count') count: number = 10,
  ) {
    return this.matchingService.getMatchingRecommendations(userId, groupId, count);
  }

  /**
   * 매칭 통계 조회
   */
  @Get('stats')
  async getMatchingStats(@CurrentUserId() userId: string) {
    return this.matchingService.getUserMatchingStats(userId);
  }

  /**
   * 매칭 기간 연장 (프리미엄)
   */
  @Post('matches/:matchId/extend')
  async extendMatch(
    @Param('matchId') matchId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.matchingService.extendMatch(matchId, userId);
  }

  /**
   * 매칭 이력 조회
   */
  @Get('history')
  async getMatchingHistory(
    @CurrentUserId() userId: string,
    @Query() query: GetMatchesQueryDto,
  ) {
    const { groupId, page = 1, limit = 20 } = query;
    return this.matchingService.getMatchingHistory(userId, groupId, page, limit);
  }

  /**
   * 일일 좋아요 갱신
   */
  @Post('likes/refresh')
  async refreshDailyLikes(@CurrentUserId() userId: string) {
    return this.matchingService.refreshDailyLikes(userId);
  }

  /**
   * 좋아요 되돌리기 (프리미엄)
   */
  @Post('likes/rewind')
  async rewindLastLike(@CurrentUserId() userId: string) {
    return this.matchingService.rewindLastLike(userId);
  }
}
