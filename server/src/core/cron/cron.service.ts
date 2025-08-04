import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MessageQueueService } from '../message-queue/message-queue.service';
import { FirebaseService } from '../firebase/firebase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * 크론 작업 서비스
 * 
 * 주기적으로 실행되는 시스템 작업을 관리합니다.
 */
@Injectable()
export class CronService implements OnModuleInit {
  /** 크론 작업 활성화 여부 */
  private isEnabled: boolean;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly messageQueueService: MessageQueueService,
    private readonly firebaseService: FirebaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Production 환경에서만 크론 작업 활성화
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  async onModuleInit() {
    if (this.isEnabled) {
      console.log('Cron jobs initialized and started');
    } else {
      console.log('Cron jobs disabled in non-production environment');
    }
  }

  /**
   * 만료된 스토리를 비활성화로 표시 (5분마다 실행)
   */
  @Cron('*/5 * * * *')
  async markExpiredStoriesAsInactive(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const now = new Date();
      
      // Find all active stories that have expired
      const expiredStories = await this.prismaService.story.updateMany({
        where: {
          isActive: true,
          expiresAt: {
            lte: now,
          },
        },
        data: {
          isActive: false,
        },
      });

      if (expiredStories.count > 0) {
        console.log(`Marked ${expiredStories.count} expired stories as inactive`);
      }
    } catch (error) {
      console.error('Error marking expired stories as inactive:', error);
    }
  }

  /**
   * 오래된 비활성 스토리 정리 (매시간 실행)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldInactiveStories(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Delete inactive stories older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deletedStories = await this.prismaService.story.deleteMany({
        where: {
          isActive: false,
          updatedAt: {
            lte: sevenDaysAgo,
          },
        },
      });

      if (deletedStories.count > 0) {
        console.log(`Deleted ${deletedStories.count} old inactive stories`);
        
        // Emit event for file cleanup
        this.eventEmitter.emit('stories.deleted', { count: deletedStories.count });
      }
    } catch (error) {
      console.error('Error cleaning up old stories:', error);
    }
  }

  /**
   * 결제 재시도 처리 (10분마다 실행)
   */
  @Cron('*/10 * * * *')
  async processPaymentRetries(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Find payments that need retry
      const pendingPayments = await this.prismaService.payment.findMany({
        where: {
          status: 'PENDING',
          // updatedAt: {
          //   lt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          // },
        },
        include: {
          user: true,
        },
      });

      for (const payment of pendingPayments) {
        // Emit payment retry event
        this.eventEmitter.emit('payment.retry', payment);
      }

      if (pendingPayments.length > 0) {
        console.log(`Processing ${pendingPayments.length} payment retries`);
      }
    } catch (error) {
      console.error('Error processing payment retries:', error);
    }
  }

  /**
   * 일일 통계 업데이트 (매일 오전 2시에 실행)
   */
  @Cron('0 2 * * *')
  async updateDailyStats(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Update active users count
      const activeUsers = await this.prismaService.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });
      
      // Update premium subscriptions count
      const premiumUsers = await this.prismaService.user.count({
        where: {
          isPremium: true,
        },
      });

      // Create daily statistics record
      // TODO: dailyStats table not in schema
      // await this.prismaService.dailyStats.create({
      //   data: {
      //     date: new Date(),
      //     activeUsers,
      //     premiumUsers,
      //     newUsers: await this.getNewUsersCount(),
      //     totalMatches: await this.getTotalMatchesCount(),
      //     totalMessages: await this.getTotalMessagesCount(),
      //   },
      // });
      
      console.log(`Daily stats updated: ${activeUsers} active users, ${premiumUsers} premium users`);
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  }

  /**
   * 일일 무료 크레딧 리셋 (매일 자정에 실행)
   */
  @Cron('0 0 * * *')
  async resetDailyCredits(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Reset daily credits for non-premium users
      const result = await this.prismaService.user.updateMany({
        where: {
          isPremium: false,
          credits: {
            lt: 1,
          },
        },
        data: {
          credits: 1,
        },
      });
      
      console.log(`Reset daily credits for ${result.count} users`);
      
      // Send notifications to users about credit reset
      if (result.count > 0) {
        this.eventEmitter.emit('credits.reset', { userCount: result.count });
      }
    } catch (error) {
      console.error('Error resetting daily credits:', error);
    }
  }

  /**
   * 예약된 알림 전송 (5분마다 실행)
   */
  @Cron('*/5 * * * *')
  async sendScheduledNotifications(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const sentCount = await this.firebaseService.sendScheduledNotifications();
      if (sentCount > 0) {
        console.log(`Sent ${sentCount} scheduled notifications`);
      }
    } catch (error) {
      console.error('Error sending scheduled notifications:', error);
    }
  }

  /**
   * 비활성 FCM 토큰 정리 (매일 오전 3시에 실행)
   */
  @Cron('0 3 * * *')
  async cleanupInactiveFCMTokens(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const cleanedCount = await this.firebaseService.cleanupInactiveFCMTokens();
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} inactive FCM tokens`);
      }
    } catch (error) {
      console.error('Error cleaning up FCM tokens:', error);
    }
  }

  /**
   * 만료된 프리미엄 구독 처리 (매일 오전 1시에 실행)
   */
  @Cron('0 1 * * *')
  async processExpiredSubscriptions(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const expiredUsers = await this.prismaService.user.updateMany({
        where: {
          isPremium: true,
          premiumUntil: {
            lte: new Date(),
          },
        },
        data: {
          isPremium: false,
          premiumUntil: null,
        },
      });

      if (expiredUsers.count > 0) {
        console.log(`Processed ${expiredUsers.count} expired premium subscriptions`);
        
        // Emit event for notification
        this.eventEmitter.emit('subscription.expired', { count: expiredUsers.count });
      }
    } catch (error) {
      console.error('Error processing expired subscriptions:', error);
    }
  }

  /**
   * 오래된 로그 정리 (매일 오전 4시에 실행)
   */
  @Cron('0 4 * * *')
  async cleanupOldLogs(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Clean up old email logs
      const deletedEmailLogs = await this.prismaService.emailLog.deleteMany({
        where: {
          sent_at: {
            lte: thirtyDaysAgo,
          },
        },
      });

      // Clean up old SMS logs
      const deletedSmsLogs = await this.prismaService.sMSLog.deleteMany({
        where: {
          createdAt: {
            lte: thirtyDaysAgo,
          },
        },
      });

      console.log(`Cleaned up ${deletedEmailLogs.count} email logs and ${deletedSmsLogs.count} SMS logs`);
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  /**
   * 비활성 사용자 알림 (매주 월요일 오전 10시에 실행)
   */
  @Cron('0 10 * * 1')
  async notifyInactiveUsers(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const inactiveUsers = await this.prismaService.user.findMany({
        where: {
          lastActive: {
            lte: sevenDaysAgo,
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Between 7-14 days
          },
        },
        select: {
          id: true,
          nickname: true,
        },
      });

      for (const user of inactiveUsers) {
        // Schedule re-engagement notification
        await this.firebaseService.scheduleNotification(
          user.id,
          {
            title: 'Glimpse에서 기다리고 있어요! 👋',
            body: '새로운 매치를 찾아보세요. 당신을 기다리는 사람이 있을지도 몰라요!',
            data: {
              type: 're_engagement',
            },
          },
          new Date()
        );
      }

      if (inactiveUsers.length > 0) {
        console.log(`Sent re-engagement notifications to ${inactiveUsers.length} inactive users`);
      }
    } catch (error) {
      console.error('Error notifying inactive users:', error);
    }
  }

  /**
   * Helper: 신규 사용자 수 조회
   */
  private async getNewUsersCount(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prismaService.user.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });
  }

  /**
   * Helper: 전체 매치 수 조회
   */
  private async getTotalMatchesCount(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prismaService.match.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });
  }

  /**
   * Helper: 전체 메시지 수 조회
   */
  private async getTotalMessagesCount(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prismaService.chatMessage.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });
  }

  /**
   * 수동 작업 실행 메서드들 (테스트용)
   */
  async runCleanupNow(): Promise<void> {
    await this.markExpiredStoriesAsInactive();
    await this.cleanupOldInactiveStories();
    await this.cleanupOldLogs();
  }

  async runPaymentRetryNow(): Promise<void> {
    await this.processPaymentRetries();
  }

  async runStatsUpdateNow(): Promise<void> {
    await this.updateDailyStats();
  }

  async runCreditResetNow(): Promise<void> {
    await this.resetDailyCredits();
  }
}