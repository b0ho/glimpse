/**
 * 통합 관심 등록 컨트롤러
 */

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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { InterestRegistrationService, RegisterInterestDto, RegistrationType } from './interest-registration.service';

@Controller('interest/registration')
@UseGuards(AuthGuard)
export class InterestRegistrationController {
  constructor(private readonly service: InterestRegistrationService) {}

  /**
   * 관심 등록 (내 정보 또는 찾는 정보)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Request() req: any,
    @Body() dto: RegisterInterestDto
  ) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return await this.service.registerInterest(userId, dto);
  }

  /**
   * 내 등록 목록 조회
   */
  @Get('my')
  async getMyRegistrations(
    @Request() req: any,
    @Query('type') registrationType?: RegistrationType
  ) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return await this.service.getMyRegistrations(userId, registrationType);
  }

  /**
   * 내 정보 등록 목록만 조회
   */
  @Get('my-info')
  async getMyInfo(@Request() req: any) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return await this.service.getMyRegistrations(userId, RegistrationType.MY_INFO);
  }

  /**
   * 찾는 정보 등록 목록만 조회
   */
  @Get('looking-for')
  async getLookingFor(@Request() req: any) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return await this.service.getMyRegistrations(userId, RegistrationType.LOOKING_FOR);
  }

  /**
   * 매칭 목록 조회
   */
  @Get('matches')
  async getMyMatches(@Request() req: any) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return await this.service.getMyMatches(userId);
  }

  /**
   * 매칭 확인/수락
   */
  @Put('matches/:matchId/confirm')
  async confirmMatch(
    @Request() req: any,
    @Param('matchId') matchId: string
  ) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return await this.service.confirmMatch(userId, matchId);
  }

  /**
   * 매칭 거절
   */
  @Put('matches/:matchId/reject')
  async rejectMatch(
    @Request() req: any,
    @Param('matchId') matchId: string
  ) {
    const userId = req.user?.id || req.headers['x-user-id'];
    // TODO: 구현
    return { message: 'Not implemented yet' };
  }

  /**
   * 등록 삭제
   */
  @Delete(':registrationId')
  async deleteRegistration(
    @Request() req: any,
    @Param('registrationId') registrationId: string
  ) {
    const userId = req.user?.id || req.headers['x-user-id'];
    // TODO: 구현
    return { message: 'Not implemented yet' };
  }

  /**
   * 통계 조회
   */
  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user?.id || req.headers['x-user-id'];
    
    // TODO: 구현
    return {
      myInfoCount: 0,
      lookingForCount: 0,
      matchesCount: 0,
      pendingMatches: 0,
      confirmedMatches: 0,
    };
  }
}