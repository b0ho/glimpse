import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';

@ApiTags('contents')
@Controller('contents')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * 콘텐츠 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '콘텐츠 목록 조회' })
  @ApiResponse({ status: 200, description: '콘텐츠 목록 조회 성공' })
  async getContents(
    @CurrentUserId() userId: string,
    @Query('groupId') groupId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    try {
      const contents = await this.contentService.getContents(
        userId,
        groupId,
        page,
        limit,
      );
      return {
        success: true,
        data: contents,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '콘텐츠 목록 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 콘텐츠 생성
   */
  @Post()
  @ApiOperation({ summary: '콘텐츠 생성' })
  @ApiResponse({ status: 201, description: '콘텐츠 생성 성공' })
  async createContent(
    @CurrentUserId() userId: string,
    @Body() contentData: any,
  ) {
    try {
      const content = await this.contentService.createContent(userId, contentData);
      return {
        success: true,
        data: content,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '콘텐츠 생성에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 콘텐츠 좋아요
   */
  @Post(':id/like')
  @ApiOperation({ summary: '콘텐츠 좋아요' })
  @ApiResponse({ status: 200, description: '좋아요 성공' })
  async likeContent(
    @CurrentUserId() userId: string,
    @Param('id') contentId: string,
  ) {
    try {
      await this.contentService.likeContent(userId, contentId);
      return {
        success: true,
        message: '좋아요를 보냈습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '좋아요 처리에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 콘텐츠 좋아요 취소
   */
  @Delete(':id/like')
  @ApiOperation({ summary: '콘텐츠 좋아요 취소' })
  @ApiResponse({ status: 200, description: '좋아요 취소 성공' })
  async unlikeContent(
    @CurrentUserId() userId: string,
    @Param('id') contentId: string,
  ) {
    try {
      await this.contentService.unlikeContent(userId, contentId);
      return {
        success: true,
        message: '좋아요를 취소했습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '좋아요 취소에 실패했습니다.',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}