import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';

/**
 * 좋아요 컨트롤러
 * 
 * 좋아요 전송, 조회, 취소 관련 API를 제공합니다.
 */
@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  /**
   * 좋아요 전송
   * 
   * @param userId 현재 사용자 ID
   * @param body 좋아요 대상 정보
   * @returns 좋아요 결과
   */
  @Post()
  async sendLike(
    @CurrentUserId() userId: string,
    @Body() body: { toUserId: string; groupId: string },
  ) {
    try {
      const result = await this.likeService.sendLike(
        userId,
        body.toUserId,
        body.groupId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '좋아요 전송에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 받은 좋아요 목록 조회
   * 
   * @param userId 현재 사용자 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 받은 좋아요 목록
   */
  @Get('received')
  async getReceivedLikes(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1', 10);
      const limitNum = parseInt(limit || '10', 10);

      const likes = await this.likeService.getReceivedLikes(
        userId,
        pageNum,
        limitNum,
      );

      return {
        success: true,
        data: likes,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '받은 좋아요 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 보낸 좋아요 목록 조회
   * 
   * @param userId 현재 사용자 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 보낸 좋아요 목록
   */
  @Get('sent')
  async getSentLikes(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1', 10);
      const limitNum = parseInt(limit || '10', 10);

      const likes = await this.likeService.getSentLikes(
        userId,
        pageNum,
        limitNum,
      );

      return {
        success: true,
        data: likes,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '보낸 좋아요 조회에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 좋아요 취소 (프리미엄)
   * 
   * @param userId 현재 사용자 ID
   * @param likeId 좋아요 ID
   */
  @Delete(':likeId')
  async cancelLike(
    @CurrentUserId() userId: string,
    @Param('likeId') likeId: string,
  ) {
    try {
      await this.likeService.cancelLike(userId, likeId);
      return {
        success: true,
        message: '좋아요가 취소되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '좋아요 취소에 실패했습니다.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
