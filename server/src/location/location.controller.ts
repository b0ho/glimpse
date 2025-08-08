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
} from '@nestjs/common';
import { LocationService } from './location.service';
import { AuthGuard } from '../auth/guards/auth.guard';
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
  async updateLocation(@Req() req: any, @Body() data: UpdateLocationDto) {
    await this.locationService.updateUserLocation(req.user.id, data);
    return { message: '위치가 업데이트되었습니다.' };
  }

  /**
   * 주변 사용자 검색
   *
   * @route GET /location/nearby/users
   */
  @Get('nearby/users')
  async getNearbyUsers(@Req() req: any, @Query() query: NearbyUsersQueryDto) {
    return this.locationService.getNearbyUsers(req.user.id, query);
  }

  /**
   * 주변 위치 그룹 검색
   *
   * @route GET /location/nearby/groups
   */
  @Get('nearby/groups')
  async getNearbyGroups(@Req() req: any, @Query('radius') radius?: number) {
    return this.locationService.getNearbyLocationGroups(req.user.id, radius);
  }

  /**
   * 위치 기반 그룹 생성
   *
   * @route POST /location/groups
   */
  @Post('groups')
  async createLocationGroup(
    @Req() req: any,
    @Body() data: CreateLocationGroupDto,
  ) {
    return this.locationService.createLocationGroup(req.user.id, data);
  }

  /**
   * QR 코드로 위치 그룹 가입
   *
   * @route POST /location/groups/join
   */
  @Post('groups/join')
  async joinLocationGroup(@Req() req: any, @Body() data: JoinLocationGroupDto) {
    return this.locationService.joinLocationGroupByQr(req.user.id, data);
  }

  /**
   * 위치 공유 설정
   *
   * @route PUT /location/sharing
   */
  @Put('sharing')
  async toggleLocationSharing(
    @Req() req: any,
    @Body('enabled') enabled: boolean,
  ) {
    return this.locationService.toggleLocationSharing(req.user.id, enabled);
  }

  /**
   * 위치 히스토리 조회
   *
   * @route GET /location/history
   */
  @Get('history')
  async getLocationHistory(@Req() req: any, @Query('days') days?: number) {
    return this.locationService.getLocationHistory(req.user.id, days);
  }
}
