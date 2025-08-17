import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NearbyUsersQueryDto } from './dto/nearby-users.dto';
import {
  CreateLocationGroupDto,
  JoinLocationGroupDto,
} from './dto/location-group.dto';

/**
 * 위치 기반 서비스 컨트롤러
 *
 * 사용자 위치 업데이트, 주변 검색, 위치 기반 그룹 등의 API를 제공합니다.
 */
@Controller('location')
@UseGuards(AuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * 현재 위치 업데이트
   *
   * @route PUT /location
   */
  @Put()
  async updateLocation(@CurrentUserId() userId: string, @Body() data: UpdateLocationDto) {
    await this.locationService.updateUserLocation(userId, data);
    return { message: '위치가 업데이트되었습니다.' };
  }

  /**
   * 주변 사용자 검색
   *
   * @route GET /location/nearby/users
   */
  @Get('nearby/users')
  async getNearbyUsers(@CurrentUserId() userId: string, @Query() query: NearbyUsersQueryDto) {
    return this.locationService.getNearbyUsers(userId, query);
  }

  /**
   * 주변 위치 그룹 검색
   *
   * @route GET /location/nearby/groups
   */
  @Get('nearby/groups')
  async getNearbyGroups(@CurrentUserId() userId: string, @Query('radius') radius?: number) {
    return this.locationService.getNearbyLocationGroups(userId, radius);
  }

  /**
   * 위치 기반 그룹 생성
   *
   * @route POST /location/groups
   */
  @Post('groups')
  async createLocationGroup(
    @CurrentUserId() userId: string,
    @Body() data: CreateLocationGroupDto,
  ) {
    return this.locationService.createLocationGroup(userId, data);
  }

  /**
   * QR 코드로 위치 그룹 가입
   *
   * @route POST /location/groups/join
   */
  @Post('groups/join')
  async joinLocationGroup(@CurrentUserId() userId: string, @Body() data: JoinLocationGroupDto) {
    return this.locationService.joinLocationGroupByQr(userId, data);
  }

  /**
   * 위치 공유 설정
   *
   * @route PUT /location/sharing
   */
  @Put('sharing')
  async toggleLocationSharing(
    @CurrentUserId() userId: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.locationService.toggleLocationSharing(userId, enabled);
  }

  /**
   * 위치 히스토리 조회
   *
   * @route GET /location/history
   */
  @Get('history')
  async getLocationHistory(@CurrentUserId() userId: string, @Query('days') days?: number) {
    return this.locationService.getLocationHistory(userId, days);
  }

  /**
   * 근처 사용자 페르소나 설정
   *
   * @route PUT /location/persona
   */
  @Put('persona')
  async updatePersona(
    @CurrentUserId() userId: string,
    @Body() personaData: {
      description: string;
      interests: string[];
      lookingFor: string;
      availability: string;
    },
  ) {
    try {
      const result = await this.locationService.updateUserPersona(userId, personaData);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '페르소나 설정에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 근처 사용자 페르소나 조회
   *
   * @route GET /location/persona
   */
  @Get('persona')
  async getPersona(@CurrentUserId() userId: string) {
    try {
      const persona = await this.locationService.getUserPersona(userId);
      return {
        success: true,
        data: persona,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '페르소나 조회에 실패했습니다.',
        },
        error.status || HttpStatus.NOT_FOUND,
      );
    }
  }
}
