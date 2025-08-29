import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { UserDeletionService } from './user-deletion.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import {
  formatLocalizedResponse,
  formatLocalizedError,
} from '../i18n/i18n.config';
import { DeleteAccountDto, RestoreAccountDto } from './dto/delete-account.dto';

/**
 * 사용자 계정 삭제 컨트롤러
 *
 * 7일 대기 시스템을 통한 안전한 계정 삭제 기능을 제공합니다.
 */
@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UserDeletionController {
  constructor(private readonly userDeletionService: UserDeletionService) {}

  /**
   * 계정 삭제 요청
   * 
   * @param userId 현재 사용자 ID
   * @param deleteAccountDto 삭제 요청 데이터
   * @param req Express Request object for i18n
   * @returns 삭제 요청 결과
   */
  @Delete('account')
  async requestAccountDeletion(
    @CurrentUserId() userId: string,
    @Body() deleteAccountDto: DeleteAccountDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.userDeletionService.requestAccountDeletion(
        userId, 
        deleteAccountDto.reason
      );

      return formatLocalizedResponse(
        req,
        {
          scheduledDeletionAt: result.scheduledDeletionAt,
          daysRemaining: result.daysRemaining,
        },
        'account.deletionRequested',
        'success',
      );
    } catch (error) {
      throw new HttpException(
        formatLocalizedError(req, 'account.deletionFailed', HttpStatus.BAD_REQUEST),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 계정 복구
   * 
   * @param userId 현재 사용자 ID
   * @param restoreAccountDto 복구 요청 데이터
   * @param req Express Request object for i18n
   * @returns 복구 결과
   */
  @Post('account/restore')
  async restoreAccount(
    @CurrentUserId() userId: string,
    @Body() restoreAccountDto: RestoreAccountDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.userDeletionService.restoreAccount(userId);

      return formatLocalizedResponse(
        req,
        { restored: true },
        'account.restored',
        'success',
      );
    } catch (error) {
      if (error.status === 400) {
        throw new HttpException(
          formatLocalizedError(req, 'account.restoreFailed', HttpStatus.BAD_REQUEST),
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        formatLocalizedError(req, 'account.restoreFailed', HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 계정 삭제 상태 조회
   * 
   * @param userId 현재 사용자 ID
   * @param req Express Request object for i18n
   * @returns 삭제 상태 정보
   */
  @Get('account/deletion-status')
  async getAccountDeletionStatus(
    @CurrentUserId() userId: string,
    @Req() req: any,
  ) {
    try {
      const status = await this.userDeletionService.getAccountDeletionStatus(userId);
      
      return formatLocalizedResponse(req, status);
    } catch (error) {
      throw new HttpException(
        formatLocalizedError(req, 'account.statusCheckFailed', HttpStatus.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 계정이 삭제 대기 중인지 확인 (middleware용)
   * 
   * @param userId 현재 사용자 ID
   * @returns 삭제 대기 상태
   */
  @Get('account/pending-deletion')
  async isPendingDeletion(@CurrentUserId() userId: string) {
    try {
      const isPending = await this.userDeletionService.isAccountPendingDeletion(userId);
      
      return {
        success: true,
        data: { isPendingDeletion: isPending },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '삭제 상태 확인에 실패했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}