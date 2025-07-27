import cron from 'node-cron';
import prisma from '../db';
import { logger } from '../utils/logger';

export class CronService {
  private static instance: CronService;
  private expiredStoriesJob?: cron.ScheduledTask;
  private storyCleanupJob?: cron.ScheduledTask;

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

    logger.info('Cron jobs started');
  }

  public stop(): void {
    if (this.expiredStoriesJob) {
      this.expiredStoriesJob.stop();
    }
    if (this.storyCleanupJob) {
      this.storyCleanupJob.stop();
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

  // Manual cleanup method for testing
  public async runCleanupNow(): Promise<void> {
    await this.markExpiredStoriesAsInactive();
    await this.cleanupOldInactiveStories();
  }
}

export const cronService = CronService.getInstance();