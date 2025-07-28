import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../middleware/logging';
import { paymentRetryService } from './PaymentRetryService';
import { businessMetrics } from '../utils/monitoring';

export class CronService {
  private static instance: CronService;
  private expiredStoriesJob?: cron.ScheduledTask;
  private storyCleanupJob?: cron.ScheduledTask;
  private paymentRetryJob?: cron.ScheduledTask;
  private dailyStatsJob?: cron.ScheduledTask;
  private creditResetJob?: cron.ScheduledTask;

  private constructor() {}

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  public start(): void {
    // Run every 5 minutes to mark expired stories as inactive
    this.expiredStoriesJob = cron.schedule('*/5 * * * *', async () => {
      await this.markExpiredStoriesAsInactive();
    });

    // Run every hour to clean up old inactive stories and their associated files
    this.storyCleanupJob = cron.schedule('0 * * * *', async () => {
      await this.cleanupOldInactiveStories();
    });
    
    // Run every 10 minutes to process payment retries
    this.paymentRetryJob = cron.schedule('*/10 * * * *', async () => {
      await this.processPaymentRetries();
    });
    
    // Run daily at 2 AM to update statistics
    this.dailyStatsJob = cron.schedule('0 2 * * *', async () => {
      await this.updateDailyStats();
    });
    
    // Run daily at midnight to reset daily free credits
    this.creditResetJob = cron.schedule('0 0 * * *', async () => {
      await this.resetDailyCredits();
    });

    logger.info('Cron jobs started');
  }

  public stop(): void {
    if (this.expiredStoriesJob) {
      this.expiredStoriesJob.stop();
    }
    if (this.storyCleanupJob) {
      this.storyCleanupJob.stop();
    }
    if (this.paymentRetryJob) {
      this.paymentRetryJob.stop();
    }
    if (this.dailyStatsJob) {
      this.dailyStatsJob.stop();
    }
    if (this.creditResetJob) {
      this.creditResetJob.stop();
    }
    logger.info('Cron jobs stopped');
  }

  private async markExpiredStoriesAsInactive(): Promise<void> {
    try {
      const now = new Date();
      
      // Find all active stories that have expired
      const expiredStories = await prisma.story.updateMany({
        where: {
          isActive: true,
          expiresAt: {
            lte: now
          }
        },
        data: {
          isActive: false
        }
      });

      if (expiredStories.count > 0) {
        logger.info(`Marked ${expiredStories.count} expired stories as inactive`);
      }
    } catch (error) {
      logger.error('Error marking expired stories as inactive:', error);
    }
  }

  private async cleanupOldInactiveStories(): Promise<void> {
    try {
      // Delete inactive stories older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deletedStories = await prisma.story.deleteMany({
        where: {
          isActive: false,
          updatedAt: {
            lte: sevenDaysAgo
          }
        }
      });

      if (deletedStories.count > 0) {
        logger.info(`Deleted ${deletedStories.count} old inactive stories`);
      }

      // Also clean up orphaned story views (where story no longer exists)
      // This is handled automatically by onDelete: Cascade in the schema
    } catch (error) {
      logger.error('Error cleaning up old stories:', error);
    }
  }

  private async processPaymentRetries(): Promise<void> {
    try {
      await paymentRetryService.processPendingRetries();
    } catch (error) {
      logger.error('Error processing payment retries:', error);
    }
  }
  
  private async updateDailyStats(): Promise<void> {
    try {
      // Update active users count
      const activeUsers = await prisma.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
      
      businessMetrics.activeUsersGauge.set(activeUsers);
      
      // Update premium subscriptions count
      const premiumUsers = await prisma.user.count({
        where: {
          isPremium: true
        }
      });
      
      businessMetrics.premiumSubscriptionsActive.set(premiumUsers);
      
      logger.info(`Daily stats updated: ${activeUsers} active users, ${premiumUsers} premium users`);
    } catch (error) {
      logger.error('Error updating daily stats:', error);
    }
  }
  
  private async resetDailyCredits(): Promise<void> {
    try {
      // Reset daily credits for non-premium users
      const result = await prisma.user.updateMany({
        where: {
          isPremium: false,
          credits: {
            lt: 1
          }
        },
        data: {
          credits: 1
        }
      });
      
      logger.info(`Reset daily credits for ${result.count} users`);
    } catch (error) {
      logger.error('Error resetting daily credits:', error);
    }
  }

  // Manual cleanup method for testing
  public async runCleanupNow(): Promise<void> {
    await this.markExpiredStoriesAsInactive();
    await this.cleanupOldInactiveStories();
  }
  
  // Manual payment retry processing for testing
  public async runPaymentRetryNow(): Promise<void> {
    await this.processPaymentRetries();
  }
}

export const cronService = CronService.getInstance();