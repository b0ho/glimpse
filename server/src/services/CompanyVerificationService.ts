import { VerificationMethod, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { validateEmail } from '@shared/utils';
import { emailService } from './EmailService';
import { ocrService } from './OCRService';

export class CompanyVerificationService {
  async submitVerification(
    userId: string,
    companyId: string,
    method: VerificationMethod,
    data: any
  ): Promise<any> {
    // Check if user already has a pending verification
    const existingVerification = await prisma.companyVerification.findFirst({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    if (existingVerification) {
      throw createError(400, '이미 처리 중인 인증 요청이 있습니다.');
    }

    // Create verification request
    const verification = await prisma.companyVerification.create({
      data: {
        userId,
        companyId,
        method,
        status: 'PENDING',
        data: JSON.stringify(data)
      }
    });

    // Process based on method
    switch (method) {
      case 'EMAIL_DOMAIN':
        await this.processEmailVerification(verification.id, data.email);
        break;
      case 'OCR_VERIFICATION':
        await this.processOCRVerification(verification.id, data.imageUrl, data.documentType);
        break;
    }

    return verification;
  }

  private async processEmailVerification(verificationId: string, email: string) {
    if (!validateEmail(email)) {
      await this.updateVerificationStatus(verificationId, 'REJECTED', '유효하지 않은 이메일 형식입니다.');
      return;
    }

    const verification = await prisma.companyVerification.findUnique({
      where: { id: verificationId },
      include: { company: true }
    });

    if (!verification || !verification.company) {
      throw createError(404, '인증 정보를 찾을 수 없습니다.');
    }

    // Check if email domain matches company domain
    const emailDomain = email.split('@')[1];
    if (emailDomain !== verification.company.domain) {
      await this.updateVerificationStatus(verificationId, 'REJECTED', '회사 도메인과 일치하지 않습니다.');
      return;
    }

    // Send verification email
    const verificationCode = this.generateVerificationCode();
    await emailService.sendVerificationEmail(email, verificationCode, verification.company.name);

    // Store verification code
    await prisma.companyVerification.update({
      where: { id: verificationId },
      data: {
        data: JSON.stringify({
          ...(verification.data as any || {}),
          verificationCode,
          codeExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        })
      }
    });
  }

  private async processOCRVerification(verificationId: string, imageUrl: string, documentType: string) {
    try {
      let result;
      switch (documentType) {
        case 'EMPLOYEE_CARD':
          result = await ocrService.processEmployeeCard(imageUrl);
          break;
        case 'BUSINESS_CARD':
          // For now, use employee card processing for all document types
          // In production, implement specific processors for each type
          result = await ocrService.processEmployeeCard(imageUrl);
          break;
        case 'PAY_STUB':
          result = await ocrService.processEmployeeCard(imageUrl);
          break;
        default:
          throw new Error('Invalid document type');
      }
      
      if (result.confidence < 0.7) {
        await this.updateVerificationStatus(verificationId, 'REJECTED', '문서를 명확하게 인식할 수 없습니다.');
        return;
      }

      // For now, auto-approve if confidence is high enough
      // In production, you might want manual review
      await this.updateVerificationStatus(verificationId, 'APPROVED', '문서 인증이 완료되었습니다.');
    } catch (error) {
      await this.updateVerificationStatus(verificationId, 'REJECTED', 'OCR 처리 중 오류가 발생했습니다.');
    }
  }

  async verifyCode(verificationId: string, code: string): Promise<boolean> {
    const verification = await prisma.companyVerification.findUnique({
      where: { id: verificationId }
    });

    if (!verification) {
      throw createError(404, '인증 정보를 찾을 수 없습니다.');
    }

    if (verification.status !== 'PENDING') {
      throw createError(400, '이미 처리된 인증 요청입니다.');
    }

    const verificationData = verification.data as any || {};
    
    if (!verificationData.codeExpiresAt || new Date(verificationData.codeExpiresAt) < new Date()) {
      throw createError(400, '인증 코드가 만료되었습니다.');
    }

    if (verificationData.verificationCode !== code) {
      return false;
    }

    // Update verification status
    await this.updateVerificationStatus(verificationId, 'APPROVED', '인증이 완료되었습니다.');

    // Company verification is tracked in CompanyVerification table, not in User table

    return true;
  }

  private async updateVerificationStatus(
    verificationId: string,
    status: VerificationStatus,
    reviewNotes?: string
  ) {
    await prisma.companyVerification.update({
      where: { id: verificationId },
      data: {
        status,
        data: JSON.stringify({
          ...(await prisma.companyVerification.findUnique({ where: { id: verificationId } }))?.data as any || {},
          reviewNotes
        }),
        reviewedAt: new Date()
      }
    });
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async getVerificationStatus(userId: string): Promise<any> {
    const latestVerification = await prisma.companyVerification.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      include: { company: true }
    });

    return latestVerification;
  }

  async isUserVerifiedForCompany(userId: string, companyId: string): Promise<boolean> {
    const verification = await prisma.companyVerification.findFirst({
      where: {
        userId,
        companyId,
        status: 'APPROVED'
      }
    });

    return !!verification;
  }
}

export const companyVerificationService = new CompanyVerificationService();