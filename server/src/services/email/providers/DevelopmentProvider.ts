import { EmailOptions, EmailProvider } from '../types';
import { logger } from '../../../utils/logger';

export class DevelopmentProvider implements EmailProvider {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    logger.info('=== Development Email ===');
    logger.info(`To: ${options.to}`);
    logger.info(`Subject: ${options.subject}`);
    logger.info(`From: ${options.from || 'noreply@glimpse.app'}`);
    logger.info('--- Email Content ---');
    logger.info(options.text || 'No plain text version');
    logger.info('======================');
    
    // In development, always return success
    return true;
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}