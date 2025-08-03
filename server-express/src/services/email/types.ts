export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface VerificationEmailData {
  userEmail: string;
  companyName: string;
  verificationCode: string;
  expiresInMinutes: number;
}

export interface MatchNotificationData {
  userEmail: string;
  userNickname: string;
  matchNickname: string;
  groupName: string;
}

export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<boolean>;
  checkHealth(): Promise<boolean>;
}