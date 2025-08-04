import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { FileService } from './file.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';

/**
 * 파일 업로드 컨트롤러
 * 
 * 프로필, 채팅, 그룹 이미지 및 문서 업로드를 처리합니다.
 */
@Controller('files')
@UseGuards(AuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * 프로필 이미지 업로드
   */
  @Post('profile')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUserId() userId: string,
  ) {
    return this.fileService.uploadProfileImage(file, userId);
  }

  /**
   * 채팅 이미지 업로드
   */
  @Post('chat/:matchId/image')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadChatImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('matchId') matchId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.fileService.uploadChatImage(file, userId, matchId);
  }

  /**
   * 채팅 음성 파일 업로드
   */
  @Post('chat/:matchId/audio')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadChatAudio(
    @UploadedFile() file: Express.Multer.File,
    @Param('matchId') matchId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.fileService.uploadChatAudio(file, userId, matchId);
  }

  /**
   * 그룹 이미지 업로드
   */
  @Post('group/:groupId')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadGroupImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('groupId') groupId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.fileService.uploadGroupImage(file, userId, groupId);
  }

  /**
   * 인증 문서 업로드
   */
  @Post('verification/:type')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadVerificationDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type: string,
    @CurrentUserId() userId: string,
  ) {
    return this.fileService.uploadVerificationDocument(file, userId, type);
  }

  /**
   * 파일 삭제
   */
  @Delete(':fileId')
  async deleteFile(
    @Param('fileId') fileId: string,
    @CurrentUserId() userId: string,
  ) {
    await this.fileService.deleteFile(fileId, userId);
    return { success: true };
  }

  /**
   * 사용자 파일 사용량 통계
   */
  @Get('stats')
  async getUserFileStats(@CurrentUserId() userId: string) {
    return this.fileService.getUserFileStats(userId);
  }
}