import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailOptions, EmailProvider } from '../types';
import { logger } from '../../../utils/logger';

export class SESProvider implements EmailProvider {
  private client: SESClient;

  constructor() {
    if (!process.env.AWS_REGION) {
      throw new Error('AWS SES region not configured');
    }
    
    this.client = new SESClient({ 
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const command = new SendEmailCommand({
        Source: options.from || process.env.SES_FROM || 'noreply@glimpse.app',
        Destination: {
          ToAddresses: [options.to]
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: options.html,
              Charset: 'UTF-8'
            },
            Text: options.text ? {
              Data: options.text,
              Charset: 'UTF-8'
            } : undefined
          }
        }
      });

      const response = await this.client.send(command);
      logger.info(`Email sent via AWS SES: ${response.MessageId}`);
      return true;
    } catch (error) {
      logger.error('AWS SES email error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Try to get send quota
      const { SESClient, GetSendQuotaCommand } = await import('@aws-sdk/client-ses');
      const client = new SESClient({ region: process.env.AWS_REGION });
      await client.send(new GetSendQuotaCommand({}));
      return true;
    } catch {
      return false;
    }
  }
}