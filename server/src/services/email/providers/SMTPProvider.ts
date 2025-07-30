import nodemailer from 'nodemailer';
import { EmailOptions, EmailProvider } from '../types';
import { logger } from '../../../utils/logger';

export class SMTPProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const result = await this.transporter.sendMail({
        from: options.from || process.env.SMTP_FROM || 'noreply@glimpse.app',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      });
      logger.info(`Email sent via SMTP: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error('SMTP email error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}