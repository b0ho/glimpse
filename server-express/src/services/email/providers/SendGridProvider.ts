import sgMail from '@sendgrid/mail';
import { EmailOptions, EmailProvider } from '../types';
import { logger } from '../../../utils/logger';

export class SendGridProvider implements EmailProvider {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SendGrid API key not configured');
    }
    sgMail.setApiKey(apiKey);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const msg = {
        to: options.to,
        from: options.from || process.env.SENDGRID_FROM || 'noreply@glimpse.app',
        subject: options.subject,
        text: options.text || '',
        html: options.html,
        attachments: options.attachments?.map(att => ({
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
          filename: att.filename,
          type: att.contentType
        }))
      };
      
      await sgMail.send(msg as any);
      logger.info(`Email sent via SendGrid to ${options.to}`);
      return true;
    } catch (error) {
      logger.error('SendGrid email error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    // SendGrid doesn't provide a health check endpoint
    return !!process.env.SENDGRID_API_KEY;
  }
}