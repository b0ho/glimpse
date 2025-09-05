import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { CreateLocationGroupDto } from './dto/location-group.dto';

/**
 * 위치 기반 그룹 전용 컨트롤러
 * 
 * 클라이언트의 /location-groups 엔드포인트 요청을 처리합니다.
 */
@Controller('location-groups')
@UseGuards(AuthGuard)
export class LocationGroupController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * 근처 그룹 조회
   * 
   * @route GET /location-groups/nearby
   */
  @Get('nearby')
  async getNearbyGroups(
    @CurrentUserId() userId: string,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 2,
  ) {
    try {
      // 개발 환경에서는 더미 데이터 반환
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          data: [
            {
              id: 'loc-1',
              name: '강남역 모임',
              description: '강남역에서 만나는 친목 모임',
              latitude: latitude + 0.001,
              longitude: longitude + 0.001,
              radius: 0.5,
              distance: 150,
              memberCount: 12,
              activeMembers: 8,
              createdBy: 'user1',
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
              isJoined: false,
            },
            {
              id: 'loc-2',
              name: '한강 러닝 크루',
              description: '한강에서 함께 달려요',
              latitude: latitude + 0.003,
              longitude: longitude - 0.002,
              radius: 1,
              distance: 420,
              memberCount: 25,
              activeMembers: 15,
              createdBy: 'user2',
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
              isJoined: true,
            },
            {
              id: 'loc-3',
              name: '홍대 카페 스터디',
              description: '카페에서 함께 공부해요',
              latitude: latitude - 0.005,
              longitude: longitude + 0.004,
              radius: 0.8,
              distance: 780,
              memberCount: 8,
              activeMembers: 6,
              createdBy: 'user3',
              createdAt: new Date(),
              isJoined: false,
            },
          ].filter(group => (group.distance / 1000) <= radius),
        };
      }

      // 프로덕션에서는 실제 서비스 호출
      const groups = await this.locationService.getNearbyLocationGroups(
        userId,
        radius,
      );
      
      return {
        success: true,
        data: groups,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '근처 그룹 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 위치 그룹 생성
   * 
   * @route POST /location-groups
   */
  @Post()
  async createLocationGroup(
    @CurrentUserId() userId: string,
    @Body() data: CreateLocationGroupDto,
  ) {
    try {
      const group = await this.locationService.createLocationGroup(userId, data);
      return {
        success: true,
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 생성에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 위치 그룹 가입
   * 
   * @route POST /location-groups/:id/join
   */
  @Post(':id/join')
  async joinLocationGroup(
    @CurrentUserId() userId: string,
    @Param('id') groupId: string,
  ) {
    try {
      // 개발 환경에서는 성공 응답
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          message: '그룹에 가입했습니다.',
          data: {
            groupId,
            userId,
            joinedAt: new Date(),
          },
        };
      }

      // 프로덕션에서는 실제 서비스 호출
      await this.locationService.joinLocationGroupById(userId, groupId);
      
      return {
        success: true,
        message: '그룹에 가입했습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 가입에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 위치 그룹 나가기
   * 
   * @route DELETE /location-groups/:id/leave
   */
  @Delete(':id/leave')
  async leaveLocationGroup(
    @CurrentUserId() userId: string,
    @Param('id') groupId: string,
  ) {
    try {
      // 개발 환경에서는 성공 응답
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          message: '그룹에서 나갔습니다.',
          data: {
            groupId,
            userId,
            leftAt: new Date(),
          },
        };
      }

      // 프로덕션에서는 실제 서비스 호출
      await this.locationService.leaveLocationGroup(userId, groupId);
      
      return {
        success: true,
        message: '그룹에서 나갔습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 나가기에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 위치 그룹 삭제
   * 
   * @route DELETE /location-groups/:id
   */
  @Delete(':id')
  async deleteLocationGroup(
    @CurrentUserId() userId: string,
    @Param('id') groupId: string,
  ) {
    try {
      // 개발 환경에서는 성공 응답
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          message: '그룹이 삭제되었습니다.',
        };
      }

      // 프로덕션에서는 실제 서비스 호출
      await this.locationService.deleteLocationGroup(userId, groupId);
      
      return {
        success: true,
        message: '그룹이 삭제되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 삭제에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}