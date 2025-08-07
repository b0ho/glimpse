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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GroupService } from './group.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import {
  CreateGroupDto,
  UpdateGroupDto,
  GetGroupsQueryDto,
  UpdateMemberRoleDto,
} from './dto/group.dto';

/**
 * 그룹 관리 컨트롤러
 */
@ApiTags('groups')
@Controller('groups')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /**
   * 그룹 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '그룹 목록 조회' })
  @ApiResponse({ status: 200, description: '그룹 목록 조회 성공' })
  async getGroups(
    @CurrentUserId() userId: string,
    @Query() query: GetGroupsQueryDto,
  ) {
    try {
      const groups = await this.groupService.getGroups(
        userId,
        query.type,
        query.search,
        query.page || 1,
        query.limit || 20,
      );
      return {
        success: true,
        data: groups,
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
   * 새 그룹 생성
   */
  @Post()
  @ApiOperation({ summary: '새 그룹 생성' })
  @ApiResponse({ status: 201, description: '그룹 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async createGroup(
    @CurrentUserId() userId: string,
    @Body() createGroupDto: CreateGroupDto,
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
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 특정 그룹 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '특정 그룹 조회' })
  @ApiResponse({ status: 200, description: '그룹 조회 성공' })
  @ApiResponse({ status: 404, description: '그룹을 찾을 수 없음' })
  async getGroupById(
    @CurrentUserId() userId: string,
    @Param('id') groupId: string,
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
        error.status || HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * 그룹 정보 수정
   */
  @Put(':id')
  @ApiOperation({ summary: '그룹 정보 수정' })
  @ApiResponse({ status: 200, description: '그룹 수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async updateGroup(
    @CurrentUserId() userId: string,
    @Param('id') groupId: string,
    @Body() updateGroupDto: UpdateGroupDto,
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
          message: error.message || '그룹 수정에 실패했습니다.',
        },
        error.status || HttpStatus.FORBIDDEN,
      );
    }
  }

  // 그룹 삭제 기능은 서비스에 구현되지 않음 - 필요 시 추가 구현 필요

  /**
   * 그룹 참여
   */
  @Post(':id/join')
  @ApiOperation({ summary: '그룹 참여' })
  @ApiResponse({ status: 200, description: '그룹 참여 성공' })
  @ApiResponse({ status: 400, description: '참여 실패' })
  async joinGroup(
    @CurrentUserId() userId: string,
    @Param('id') groupId: string,
  ) {
    try {
      await this.groupService.joinGroup(groupId, userId);
      return {
        success: true,
        message: '그룹에 참여했습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 참여에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 그룹 탈퇴
   */
  @Delete(':id/leave')
  @ApiOperation({ summary: '그룹 탈퇴' })
  @ApiResponse({ status: 200, description: '그룹 탈퇴 성공' })
  async leaveGroup(
    @CurrentUserId() userId: string,
    @Param('id') groupId: string,
  ) {
    try {
      await this.groupService.leaveGroup(groupId, userId);
      return {
        success: true,
        message: '그룹에서 탈퇴했습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '그룹 탈퇴에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 사용자의 그룹 목록 조회
   */
  @Get('my-groups')
  @ApiOperation({ summary: '내 그룹 목록 조회' })
  @ApiResponse({ status: 200, description: '그룹 목록 조회 성공' })
  async getMyGroups(@CurrentUserId() userId: string) {
    try {
      const groups = await this.groupService.getUserGroups(userId);
      return {
        success: true,
        data: groups,
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
   * 초대 링크 생성
   */
  @Post(':id/invites')
  @ApiOperation({ summary: '초대 링크 생성' })
  @ApiResponse({ status: 201, description: '초대 링크 생성 성공' })
  async generateInviteLink(
    @CurrentUserId() userId: string,
    @Param('id') groupId: string,
  ) {
    try {
      const inviteLink = await this.groupService.generateInviteLink(
        groupId,
        userId,
      );
      return {
        success: true,
        data: { inviteLink },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '초대 링크 생성에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 초대 코드로 그룹 참여
   */
  @Post('join/:code')
  @ApiOperation({ summary: '초대 코드로 그룹 참여' })
  @ApiResponse({ status: 200, description: '그룹 참여 성공' })
  async joinGroupByInvite(
    @CurrentUserId() userId: string,
    @Param('code') inviteCode: string,
  ) {
    try {
      const result = await this.groupService.joinByInviteCode(
        inviteCode,
        userId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '초대 코드를 사용한 참여에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 멤버 역할 변경
   */
  @Put(':id/members/:memberId')
  @ApiOperation({ summary: '멤버 역할 변경' })
  @ApiResponse({ status: 200, description: '역할 변경 성공' })
  async updateMemberRole(
    @CurrentUserId() userId: string,
    @Param('id') groupId: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    try {
      await this.groupService.updateMemberRole(
        groupId,
        userId,
        memberId,
        updateMemberRoleDto,
      );
      return {
        success: true,
        message: '멤버 역할이 변경되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '멤버 역할 변경에 실패했습니다.',
        },
        error.status || HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * 멤버 제거
   */
  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: '멤버 제거' })
  @ApiResponse({ status: 200, description: '멤버 제거 성공' })
  async removeMember(
    @CurrentUserId() userId: string,
    @Param('id') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    try {
      await this.groupService.removeMember(groupId, userId, memberId);
      return {
        success: true,
        message: '멤버가 제거되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '멤버 제거에 실패했습니다.',
        },
        error.status || HttpStatus.FORBIDDEN,
      );
    }
  }
}
