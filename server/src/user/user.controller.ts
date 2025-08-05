import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';

/**
 * 사용자 컨트롤러
 *
 * 사용자 프로필, 추천, 크레딧 관련 API를 제공합니다.
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 현재 사용자 프로필 조회
   *
   * @param userId 현재 사용자 ID
   * @returns 사용자 프로필
   */
  @Get('profile')
  async getMyProfile(@CurrentUserId() userId: string) {
    try {
      const user = await this.userService.findById(userId);
      return {
        success: true,
        data: {
          id: user.id,
          nickname: user.nickname,
          phoneNumber: user.phoneNumber,
          profileImage: user.profileImage,
          bio: user.bio,
          age: user.age,
          gender: user.gender,
          height: user.height,
          mbti: user.mbti,
          location: user.location,
          isPremium: user.isPremium,
          credits: user.credits,
          lastActive: user.lastActive,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '프로필 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 현재 사용자 프로필 업데이트
   *
   * @param userId 현재 사용자 ID
   * @param updateData 업데이트할 데이터
   * @returns 업데이트된 프로필
   */
  @Put('profile')
  async updateProfile(
    @CurrentUserId() userId: string,
    @Body() updateData: any,
  ) {
    try {
      const user = await this.userService.updateProfile(userId, updateData);
      return {
        success: true,
        data: {
          id: user.id,
          nickname: user.nickname,
          bio: user.bio,
          profileImage: user.profileImage,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '프로필 업데이트에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 사용자 추천 목록 조회
   *
   * @param userId 현재 사용자 ID
   * @param groupId 그룹 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 추천 사용자 목록
   */
  @Get('recommendations')
  async getRecommendations(
    @CurrentUserId() userId: string,
    @Query('groupId') groupId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1', 10);
      const limitNum = parseInt(limit || '10', 10);

      const recommendations = await this.userService.getRecommendations(
        userId,
        groupId,
        pageNum,
        limitNum,
      );

      return {
        success: true,
        data: recommendations,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '추천 목록 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 다른 사용자 프로필 조회
   *
   * @param userId 현재 사용자 ID
   * @param targetUserId 대상 사용자 ID
   * @returns 사용자 프로필 (매칭된 경우만 상세 정보)
   */
  @Get(':userId')
  async getUserProfile(
    @CurrentUserId() currentUserId: string,
    @Param('userId') targetUserId: string,
  ) {
    try {
      const canViewDetails = await this.userService.canViewUserDetails(
        currentUserId,
        targetUserId,
      );

      const user = await this.userService.findById(targetUserId);

      if (!canViewDetails) {
        // 매칭되지 않은 경우 제한된 정보만 제공
        return {
          success: true,
          data: {
            id: user.id,
            nickname: user.nickname
              ? user.nickname.charAt(0) + '*'.repeat(user.nickname.length - 1)
              : 'Anonymous',
            profileImage: user.profileImage,
            bio: user.bio?.substring(0, 50) + '...',
            gender: user.gender,
          },
        };
      }

      // 매칭된 경우 전체 정보 제공
      return {
        success: true,
        data: {
          id: user.id,
          nickname: user.nickname,
          profileImage: user.profileImage,
          bio: user.bio,
          age: user.age,
          gender: user.gender,
          height: user.height,
          mbti: user.mbti,
          companyName: user.companyName,
          education: user.education,
          location: user.location,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '사용자 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 사용자 통계 조회
   *
   * @param userId 현재 사용자 ID
   * @returns 사용자 통계
   */
  @Get('stats')
  async getUserStats(@CurrentUserId() userId: string) {
    try {
      const stats = await this.userService.getUserStats(userId);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '통계 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 남은 좋아요 수 조회
   *
   * @param userId 현재 사용자 ID
   * @returns 남은 좋아요 수
   */
  @Get('likes/remaining')
  async getDailyLikesRemaining(@CurrentUserId() userId: string) {
    try {
      const remaining = await this.userService.getDailyLikesRemaining(userId);
      return {
        success: true,
        data: {
          remaining,
          dailyLimit: 1, // APP_CONFIG.MAX_DAILY_LIKES
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '좋아요 수 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 크레딧 구매
   *
   * @param userId 현재 사용자 ID
   * @param body 구매 정보
   * @returns 구매 결과
   */
  @Post('credits/purchase')
  async purchaseCredits(
    @CurrentUserId() userId: string,
    @Body() body: { packageId: string; paymentMethodId: string },
  ) {
    try {
      const result = await this.userService.purchaseCredits(
        userId,
        body.packageId,
        body.paymentMethodId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '크레딧 구매에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
