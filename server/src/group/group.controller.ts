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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { GroupType } from '@prisma/client';

/**
 * 그룹 컨트롤러
 * 
 * 그룹 생성, 관리, 멤버십 관련 API를 제공합니다.
 */
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /**
   * 그룹 목록 조회
   * 
   * @param userId 현재 사용자 ID
   * @param type 그룹 타입 필터
   * @param search 검색어
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 그룹 목록
   */
  @Get()
  async getGroups(
    @CurrentUserId() userId: string,
    @Query('type') type?: GroupType,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1', 10);
      const limitNum = parseInt(limit || '10', 10);

      const groups = await this.groupService.getGroups(
        userId,
        type,
        search,
        pageNum,
        limitNum,
      );

      return {
        success: true,
        data: groups,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 목록 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 그룹 상세 정보 조회
   * 
   * @param userId 현재 사용자 ID
   * @param groupId 그룹 ID
   * @returns 그룹 상세 정보
   */
  @Get(':groupId')
  async getGroup(
    @CurrentUserId() userId: string,
    @Param('groupId') groupId: string,
  ) {
    try {
      const group = await this.groupService.getGroupById(groupId, userId);
      return {
        success: true,
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 그룹 생성
   * 
   * @param userId 현재 사용자 ID
   * @param createGroupDto 그룹 생성 데이터
   * @returns 생성된 그룹 정보
   */
  @Post()
  async createGroup(
    @CurrentUserId() userId: string,
    @Body() createGroupDto: {
      name: string;
      description?: string;
      type: GroupType;
      settings?: any;
      location?: any;
      companyId?: string;
    },
  ) {
    try {
      const group = await this.groupService.createGroup(userId, createGroupDto);
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
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 그룹 업데이트
   * 
   * @param userId 현재 사용자 ID
   * @param groupId 그룹 ID
   * @param updateGroupDto 업데이트 데이터
   * @returns 업데이트된 그룹 정보
   */
  @Put(':groupId')
  async updateGroup(
    @CurrentUserId() userId: string,
    @Param('groupId') groupId: string,
    @Body() updateGroupDto: {
      name?: string;
      description?: string;
      settings?: any;
    },
  ) {
    try {
      const group = await this.groupService.updateGroup(
        groupId,
        userId,
        updateGroupDto,
      );
      return {
        success: true,
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 업데이트에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 그룹 가입
   * 
   * @param userId 현재 사용자 ID
   * @param groupId 그룹 ID
   * @returns 멤버십 정보
   */
  @Post(':groupId/join')
  async joinGroup(
    @CurrentUserId() userId: string,
    @Param('groupId') groupId: string,
  ) {
    try {
      const membership = await this.groupService.joinGroup(groupId, userId);
      return {
        success: true,
        data: membership,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 가입에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 그룹 탈퇴
   * 
   * @param userId 현재 사용자 ID
   * @param groupId 그룹 ID
   */
  @Delete(':groupId/leave')
  async leaveGroup(
    @CurrentUserId() userId: string,
    @Param('groupId') groupId: string,
  ) {
    try {
      await this.groupService.leaveGroup(groupId, userId);
      return {
        success: true,
        message: '그룹을 탈퇴했습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 탈퇴에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 그룹 초대 링크 생성
   * 
   * @param userId 현재 사용자 ID
   * @param groupId 그룹 ID
   * @returns 초대 링크 정보
   */
  @Post(':groupId/invite')
  async generateInviteLink(
    @CurrentUserId() userId: string,
    @Param('groupId') groupId: string,
  ) {
    try {
      const inviteInfo = await this.groupService.generateInviteLink(
        groupId,
        userId,
      );
      return {
        success: true,
        data: inviteInfo,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '초대 링크 생성에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 초대 코드로 그룹 가입
   * 
   * @param userId 현재 사용자 ID
   * @param inviteCode 초대 코드
   * @returns 가입한 그룹 정보
   */
  @Post('join/:inviteCode')
  async joinByInviteCode(
    @CurrentUserId() userId: string,
    @Param('inviteCode') inviteCode: string,
  ) {
    try {
      const group = await this.groupService.joinByInviteCode(inviteCode, userId);
      return {
        success: true,
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '초대 코드로 가입에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
