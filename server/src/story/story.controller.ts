import { Controller, Post, Get, Delete, Param, Query, Body, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StoryService } from './story.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Express } from 'express';

/**
 * 스토리 기능 컨트롤러
 */
@ApiTags('stories')
@Controller('stories')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  /**
   * 새 스토리 생성
   */
  @Post()
  @UseInterceptors(FileInterceptor('media'))
  @ApiOperation({ summary: '새 스토리 생성' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        media: {
          type: 'string',
          format: 'binary',
        },
        caption: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '스토리 생성됨' })
  async createStory(
    @Req() req: any,
    @UploadedFile() media: Express.Multer.File,
    @Body('caption') caption?: string
  ) {
    const userId = req.user.id;
    return this.storyService.createStory(userId, media, caption);
  }

  /**
   * 내 스토리 조회
   */
  @Get('my')
  @ApiOperation({ summary: '내 스토리 조회' })
  @ApiResponse({ status: 200, description: '내 스토리 목록' })
  async getMyStories(@Req() req: any) {
    const userId = req.user.id;
    return this.storyService.getUserStories(userId);
  }

  /**
   * 매칭된 사용자들의 스토리 조회 (피드)
   */
  @Get('feed')
  @ApiOperation({ summary: '매칭된 사용자들의 스토리 조회' })
  @ApiResponse({ status: 200, description: '스토리 피드' })
  async getMatchedUsersStories(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const userId = req.user.id;
    return this.storyService.getMatchedUsersStories(
      userId,
      page || 1,
      limit || 20
    );
  }

  /**
   * 특정 스토리 조회
   */
  @Get(':storyId')
  @ApiOperation({ summary: '특정 스토리 조회' })
  @ApiResponse({ status: 200, description: '스토리 상세 정보' })
  async getStoryById(
    @Req() req: any,
    @Param('storyId') storyId: string
  ) {
    const viewerId = req.user.id;
    return this.storyService.getStoryById(storyId, viewerId);
  }

  /**
   * 스토리 조회 (조회됨 표시)
   */
  @Post(':storyId/view')
  @ApiOperation({ summary: '스토리 조회 표시' })
  @ApiResponse({ status: 200, description: '조회 기록됨' })
  async viewStory(
    @Req() req: any,
    @Param('storyId') storyId: string
  ) {
    const viewerId = req.user.id;
    return this.storyService.viewStory(storyId, viewerId);
  }

  /**
   * 스토리 조회자 목록
   */
  @Get(':storyId/viewers')
  @ApiOperation({ summary: '스토리 조회자 목록' })
  @ApiResponse({ status: 200, description: '조회자 목록' })
  async getStoryViewers(
    @Req() req: any,
    @Param('storyId') storyId: string
  ) {
    const userId = req.user.id;
    return this.storyService.getStoryViewers(storyId, userId);
  }

  /**
   * 스토리 삭제
   */
  @Delete(':storyId')
  @ApiOperation({ summary: '스토리 삭제' })
  @ApiResponse({ status: 200, description: '스토리 삭제됨' })
  async deleteStory(
    @Req() req: any,
    @Param('storyId') storyId: string
  ) {
    const userId = req.user.id;
    return this.storyService.deleteStory(storyId, userId);
  }

  /**
   * 특정 사용자의 스토리 조회
   */
  @Get('user/:userId')
  @ApiOperation({ summary: '특정 사용자의 스토리 조회' })
  @ApiResponse({ status: 200, description: '사용자 스토리 목록' })
  async getUserStories(@Param('userId') userId: string) {
    return this.storyService.getUserStories(userId);
  }
}