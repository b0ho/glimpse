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
import { InterestService } from './interest.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import {
  CreateInterestSearchDto,
  UpdateInterestSearchDto,
  GetInterestSearchesQueryDto,
  CheckMatchDto,
  InterestSearchResponseDto,
  InterestMatchResponseDto,
} from './dto/interest.dto';

/**
 * 관심상대 찾기 컨트롤러
 *
 * 다양한 방법으로 관심있는 사람을 찾고 매칭하는 API를 제공합니다.
 */
@Controller('interest')
@UseGuards(AuthGuard)
export class InterestController {
  constructor(private readonly interestService: InterestService) {}

  /**
   * 관심사 검색 (테스트용)
   * GET /api/v1/interest/search
   */
  @Get('search')
  async searchInterests(@Query('query') query: string) {
    return {
      success: true,
      data: [
        { id: '1', name: 'coffee', category: 'beverage' },
        { id: '2', name: 'coffee shop', category: 'place' },
      ],
    };
  }

  /**
   * 관심사 추천 (테스트용)
   * GET /api/v1/interest/recommendations
   */
  @Get('recommendations')
  async getRecommendations() {
    return {
      success: true,
      data: [
        { id: '1', name: 'reading', category: 'hobby' },
        { id: '2', name: 'hiking', category: 'sport' },
      ],
    };
  }

  /**
   * 관심상대 검색 등록
   * POST /api/v1/interest/search
   */
  @Post('search')
  @HttpCode(HttpStatus.CREATED)
  async createInterestSearch(
    @CurrentUserId() userId: string,
    @Body() dto: CreateInterestSearchDto,
  ): Promise<InterestSearchResponseDto> {
    return this.interestService.createInterestSearch(userId, dto);
  }

  /**
   * 내 관심상대 검색 목록 조회
   * GET /api/v1/interest/searches
   */
  @Get('searches')
  async getMyInterestSearches(
    @CurrentUserId() userId: string,
    @Query() query: GetInterestSearchesQueryDto,
  ): Promise<InterestSearchResponseDto[]> {
    return this.interestService.getMyInterestSearches(userId, query);
  }

  /**
   * 관심상대 검색 업데이트
   * PUT /api/v1/interest/searches/:id
   */
  @Put('searches/:id')
  async updateInterestSearch(
    @CurrentUserId() userId: string,
    @Param('id') searchId: string,
    @Body() dto: UpdateInterestSearchDto,
  ): Promise<InterestSearchResponseDto> {
    return this.interestService.updateInterestSearch(userId, searchId, dto);
  }

  /**
   * 관심상대 검색 삭제
   * DELETE /api/v1/interest/searches/:id
   */
  @Delete('searches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInterestSearch(
    @CurrentUserId() userId: string,
    @Param('id') searchId: string,
  ): Promise<void> {
    return this.interestService.deleteInterestSearch(userId, searchId);
  }

  /**
   * 매칭된 목록 조회
   * GET /api/v1/interest/matches
   */
  @Get('matches')
  async getMatches(
    @CurrentUserId() userId: string,
  ): Promise<InterestMatchResponseDto[]> {
    return this.interestService.getMatches(userId);
  }

  /**
   * 즉시 매칭 확인
   * POST /api/v1/interest/check-match
   */
  @Post('check-match')
  async checkMatch(
    @CurrentUserId() userId: string,
    @Body() dto: CheckMatchDto,
  ): Promise<InterestMatchResponseDto | null> {
    return this.interestService.checkMatch(userId, dto);
  }

  /**
   * 보안 관심상대 등록 (해시 기반)
   * POST /api/v1/interest/secure/register
   */
  @Post('secure/register')
  @HttpCode(HttpStatus.CREATED)
  async registerSecureInterest(
    @CurrentUserId() userId: string,
    @Body() dto: any,
  ): Promise<any> {
    return this.interestService.createSecureInterestSearch(userId, dto);
  }

  /**
   * 내 보안 관심상대 상태 조회
   * GET /api/v1/interest/secure/my-status
   */
  @Get('secure/my-status')
  async getMySecureStatus(
    @CurrentUserId() userId: string,
  ): Promise<any[]> {
    return this.interestService.getMySecureStatus(userId);
  }

  /**
   * 보안 매칭 목록 조회
   * GET /api/v1/interest/secure/matches
   */
  @Get('secure/matches')
  async getSecureMatches(
    @CurrentUserId() userId: string,
  ): Promise<any[]> {
    return this.interestService.getSecureMatches(userId);
  }

  /**
   * 보안 관심상대 취소
   * POST /api/v1/interest/secure/cancel/:id
   */
  @Post('secure/cancel/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelSecureInterest(
    @CurrentUserId() userId: string,
    @Param('id') cardId: string,
  ): Promise<void> {
    return this.interestService.cancelSecureInterest(userId, cardId);
  }

  /**
   * 복합 조건 매칭 확인
   * POST /api/v1/interest/secure/check-multi
   */
  @Post('secure/check-multi')
  async checkMultiMatch(
    @CurrentUserId() userId: string,
    @Body() dto: any,
  ): Promise<{ matched: boolean }> {
    return this.interestService.checkMultiMatch(userId, dto);
  }
}
