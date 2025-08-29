import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserDeletionService } from './user-deletion.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * 계정 삭제 스케줄러 서비스
 * 
 * 7일 대기 기간이 만료된 계정들을 자동으로 영구 삭제합니다.
 */
@Injectable()
export class AccountDeletionSchedulerService {
  private readonly isEnabled: boolean;

  constructor(
    private readonly userDeletionService: UserDeletionService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Production 환경에서만 스케줄러 활성화
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  /**
   * 삭제 예정 계정 영구 삭제 (매일 오전 5시에 실행)
   */
  @Cron('0 5 * * *')
  async processScheduledAccountDeletions(): Promise<void> {
    if (!this.isEnabled) {
      console.log('Account deletion scheduler disabled in non-production environment');
      return;
    }

    try {
      console.log('Starting scheduled account deletion process...');

      // 7일 대기 기간이 지난 계정들 조회
      const accountsToDelete = await this.userDeletionService.getAccountsScheduledForDeletion();

      if (accountsToDelete.length === 0) {
        console.log('No accounts scheduled for deletion');
        return;
      }

      console.log(`Found ${accountsToDelete.length} accounts scheduled for deletion`);

      let deletedCount = 0;
      let failedCount = 0;
      const failedAccounts: string[] = [];

      // 각 계정을 순차적으로 삭제 (동시 실행으로 인한 DB 부하 방지)
      for (const userId of accountsToDelete) {
        try {
          await this.userDeletionService.permanentlyDeleteAccount(userId, false);
          deletedCount++;
          
          console.log(`Successfully deleted account: ${userId}`);
          
          // 삭제 완료 이벤트 발생
          this.eventEmitter.emit('account.permanently_deleted', {
            userId,
            deletedAt: new Date(),
            reason: 'scheduled_deletion'
          });

        } catch (error) {
          failedCount++;
          failedAccounts.push(userId);
          
          console.error(`Failed to delete account ${userId}:`, error.message);
          
          // 삭제 실패 이벤트 발생 (관리자 알림용)
          this.eventEmitter.emit('account.deletion_failed', {
            userId,
            error: error.message,
            attemptedAt: new Date()
          });
        }

        // 각 삭제 간 짧은 대기 (DB 부하 완화)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 처리 결과 로깅
      console.log(`Account deletion process completed:`);
      console.log(`- Successfully deleted: ${deletedCount} accounts`);
      console.log(`- Failed: ${failedCount} accounts`);
      
      if (failedAccounts.length > 0) {
        console.log(`- Failed accounts: ${failedAccounts.join(', ')}`);
      }

      // 완료 알림 이벤트 발생 (관리자 대시보드용)
      this.eventEmitter.emit('account.deletion_batch_completed', {
        totalProcessed: accountsToDelete.length,
        successCount: deletedCount,
        failedCount: failedCount,
        failedAccounts: failedAccounts,
        processedAt: new Date()
      });

    } catch (error) {
      console.error('Error in scheduled account deletion process:', error);
      
      // 전체 프로세스 실패 이벤트 발생
      this.eventEmitter.emit('account.deletion_process_failed', {
        error: error.message,
        failedAt: new Date()
      });
    }
  }

  /**
   * 삭제 예정 계정 알림 (매일 오전 9시에 실행)
   * 삭제 1일 전 사용자에게 최종 알림
   */
  @Cron('0 9 * * *')
  async sendDeletionReminders(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      console.log('Checking for accounts that need deletion reminders...');

      // 내일 삭제될 계정들을 찾기 위한 날짜 계산
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(5, 0, 0, 0); // 내일 오전 5시

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // 7일 전에 삭제 요청된 계정들 (내일 삭제 예정)
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
      sixDaysAgo.setHours(0, 0, 0, 0);

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      fiveDaysAgo.setHours(0, 0, 0, 0);

      // TODO: 실제 구현 시 UserService와의 의존성 해결 필요
      // const accountsToNotify = await this.prismaService.user.findMany({
      //   where: {
      //     deletedAt: {
      //       gte: sixDaysAgo,
      //       lt: fiveDaysAgo,
      //     },
      //   },
      //   select: {
      //     id: true,
      //     nickname: true,
      //     phoneNumber: true,
      //   },
      // });

      // for (const user of accountsToNotify) {
      //   // SMS 또는 푸시 알림으로 최종 복구 기회 제공
      //   this.eventEmitter.emit('account.final_deletion_warning', {
      //     userId: user.id,
      //     nickname: user.nickname,
      //     phoneNumber: user.phoneNumber,
      //     scheduledDeletionAt: tomorrow,
      //   });
      // }

      console.log('Deletion reminder check completed');

    } catch (error) {
      console.error('Error sending deletion reminders:', error);
    }
  }

  /**
   * 계정 삭제 통계 업데이트 (매일 자정에 실행)
   */
  @Cron('0 0 * * *')
  async updateAccountDeletionStats(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // TODO: 통계 테이블 구현 시 추가
      // const stats = {
      //   deletionRequestsToday: await this.prismaService.user.count({
      //     where: {
      //       deletedAt: {
      //         gte: today,
      //       },
      //     },
      //   }),
      //   accountsRestoredToday: 0, // 복구 이벤트 카운트 필요
      //   accountsPermanentlyDeletedToday: 0, // 영구 삭제 이벤트 카운트 필요
      // };

      // 관리자 대시보드용 이벤트 발생
      this.eventEmitter.emit('account.daily_stats_updated', {
        date: yesterday,
        // stats,
      });

    } catch (error) {
      console.error('Error updating account deletion stats:', error);
    }
  }

  /**
   * 수동 실행 메서드 (테스트 및 관리자용)
   */
  async runAccountDeletionNow(): Promise<{
    processed: number;
    deleted: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      deleted: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      const accountsToDelete = await this.userDeletionService.getAccountsScheduledForDeletion();
      result.processed = accountsToDelete.length;

      for (const userId of accountsToDelete) {
        try {
          await this.userDeletionService.permanentlyDeleteAccount(userId, false);
          result.deleted++;
        } catch (error) {
          result.failed++;
          result.errors.push(`${userId}: ${error.message}`);
        }
      }

    } catch (error) {
      result.errors.push(`Process error: ${error.message}`);
    }

    return result;
  }

  /**
   * 스케줄러 상태 확인
   */
  getSchedulerStatus(): {
    enabled: boolean;
    environment: string;
    nextRun: string;
  } {
    return {
      enabled: this.isEnabled,
      environment: process.env.NODE_ENV || 'development',
      nextRun: this.isEnabled ? 'Daily at 5:00 AM' : 'Disabled',
    };
  }
}