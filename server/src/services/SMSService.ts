import crypto from 'crypto';

interface VerificationCode {
  code: string;
  phoneNumber: string;
  expiresAt: Date;
}

// In-memory storage for development (use Redis in production)
const verificationCodes = new Map<string, VerificationCode>();

export class SMSService {
  async sendVerificationCode(phoneNumber: string): Promise<{ verificationId: string }> {
    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store verification code
    verificationCodes.set(verificationId, {
      code,
      phoneNumber,
      expiresAt
    });

    // In development, log the code instead of sending SMS
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 SMS Verification Code for ${phoneNumber}: ${code}`);
    } else {
      // TODO: Integrate with actual SMS service (Twilio, Aligo, etc.)
      await this.sendSMSViaTwilio(phoneNumber, code);
    }

    return { verificationId };
  }

  async verifyCode(verificationId: string, code: string): Promise<boolean> {
    const verification = verificationCodes.get(verificationId);
    
    if (!verification) {
      return false;
    }

    if (new Date() > verification.expiresAt) {
      verificationCodes.delete(verificationId);
      return false;
    }

    if (verification.code !== code) {
      return false;
    }

    // Clean up after successful verification
    verificationCodes.delete(verificationId);
    return true;
  }

  private async sendSMSViaTwilio(phoneNumber: string, code: string) {
    // TODO: Implement Twilio SMS sending
    console.log(`Sending SMS to ${phoneNumber}: 인증코드: ${code}`);
  }

  private async sendSMSViaAligo(phoneNumber: string, code: string) {
    // TODO: Implement Korean SMS service (Aligo, NHN Cloud, etc.)
    console.log(`Sending SMS via Aligo to ${phoneNumber}: 인증코드: ${code}`);
  }
}