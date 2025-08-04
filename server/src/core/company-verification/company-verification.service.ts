import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { VerificationMethod, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OcrService } from '../ocr/ocr.service';
import { EncryptionService } from '../encryption/encryption.service';
import { CacheService } from '../cache/cache.service';
// import { validateEmail } from '@shared/utils';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 회사 인증 서비스
 * 
 * 이메일 도메인 및 OCR 기반 회사 인증을 처리합니다.
 */
@Injectable()
export class CompanyVerificationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly ocrService: OcrService,
    private readonly encryptionService: EncryptionService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 회사 인증 요청 제출
   */
  async submitVerification(
    userId: string,
    companyId: string,
    method: VerificationMethod,
    data: any
  ): Promise<any> {
    // Check if user already has a pending verification
    const existingVerification = await this.prismaService.companyVerification.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (existingVerification) {
      throw new HttpException('이미 처리 중인 인증 요청이 있습니다.', HttpStatus.BAD_REQUEST);
    }

    // Create verification request
    const verification = await this.prismaService.companyVerification.create({
      data: {
        userId,
        companyId,
        method,
        status: 'PENDING',
        data: JSON.stringify(data),
      },
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

  /**
   * 이메일 도메인 인증 처리
   */
  private async processEmailVerification(verificationId: string, email: string): Promise<void> {
    if (!validateEmail(email)) {
      await this.updateVerificationStatus(verificationId, 'REJECTED', '유효하지 않은 이메일 형식입니다.');
      return;
    }

    const verification = await this.prismaService.companyVerification.findUnique({
      where: { id: verificationId },
      include: { company: true },
    });

    if (!verification || !verification.company) {
      throw new HttpException('인증 정보를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    // Check if email domain matches company domain
    const emailDomain = email.split('@')[1];
    if (emailDomain !== verification.company.domain) {
      await this.updateVerificationStatus(verificationId, 'REJECTED', '회사 도메인과 일치하지 않습니다.');
      return;
    }

    // Generate verification code
    const verificationCode = this.encryptionService.generateRandomCode(6);
    
    // Send verification email
    await this.emailService.sendCompanyVerificationEmail({
      userEmail: email,
      verificationCode: verificationCode,
      companyName: verification.company.name,
      expiresInMinutes: 30,
    });

    // Store verification code with expiry
    const verificationData = {
      ...(verification.data as any || {}),
      verificationCode,
      codeExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    await this.prismaService.companyVerification.update({
      where: { id: verificationId },
      data: {
        data: JSON.stringify(verificationData),
      },
    });

    // Cache verification code for quick lookup
    await this.cacheService.set(
      `company_verification:${verificationId}`,
      { verificationCode, expiresAt: verificationData.codeExpiresAt },
      { ttl: 1800 } // 30 minutes
    );
  }

  /**
   * OCR 기반 문서 인증 처리
   */
  private async processOCRVerification(
    verificationId: string, 
    imageUrl: string, 
    documentType: string
  ): Promise<void> {
    try {
      // Download image if it's a URL
      let imageBuffer: Buffer;
      if (imageUrl.startsWith('http')) {
        // In production, you would download the image from URL
        throw new Error('URL download not implemented yet');
      } else {
        // Assume base64
        imageBuffer = Buffer.from(imageUrl, 'base64');
      }

      let result;
      switch (documentType) {
        case 'EMPLOYEE_CARD':
          result = await this.ocrService.processEmployeeCard(imageBuffer);
          break;
        case 'BUSINESS_CARD':
          // For now, use employee card processing for all document types
          // In production, implement specific processors for each type
          result = await this.ocrService.processEmployeeCard(imageBuffer);
          break;
        case 'PAY_STUB':
          result = await this.ocrService.processEmployeeCard(imageBuffer);
          break;
        default:
          throw new Error('Invalid document type');
      }
      
      if (result.confidence < 0.7) {
        await this.updateVerificationStatus(verificationId, 'REJECTED', '문서를 명확하게 인식할 수 없습니다.');
        return;
      }

      // Store OCR results for review
      const verification = await this.prismaService.companyVerification.findUnique({
        where: { id: verificationId },
      });

      const verificationData = {
        ...(verification?.data as any || {}),
        ocrResult: result,
        processedAt: new Date().toISOString(),
      };

      await this.prismaService.companyVerification.update({
        where: { id: verificationId },
        data: {
          data: JSON.stringify(verificationData),
        },
      });

      // For now, auto-approve if confidence is high enough
      // In production, you might want manual review
      if (result.confidence >= 0.8) {
        await this.updateVerificationStatus(verificationId, 'APPROVED', '문서 인증이 완료되었습니다.');
      } else {
        // Mark for manual review
        await this.updateVerificationStatus(verificationId, 'PENDING', '수동 검토가 필요합니다.');
      }
    } catch (error) {
      console.error('OCR verification error:', error);
      await this.updateVerificationStatus(verificationId, 'REJECTED', 'OCR 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 인증 코드 확인
   */
  async verifyCode(verificationId: string, code: string): Promise<boolean> {
    // Try to get from cache first
    const cachedData = await this.cacheService.get<any>(`company_verification:${verificationId}`);
    
    if (cachedData) {
      if (new Date(cachedData.expiresAt) < new Date()) {
        throw new HttpException('인증 코드가 만료되었습니다.', HttpStatus.BAD_REQUEST);
      }
      
      if (cachedData.verificationCode === code) {
        await this.updateVerificationStatus(verificationId, 'APPROVED', '인증이 완료되었습니다.');
        await this.cacheService.delete(`company_verification:${verificationId}`);
        return true;
      }
      return false;
    }

    // Fallback to database
    const verification = await this.prismaService.companyVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new HttpException('인증 정보를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (verification.status !== 'PENDING') {
      throw new HttpException('이미 처리된 인증 요청입니다.', HttpStatus.BAD_REQUEST);
    }

    const verificationData = verification.data as any || {};
    
    if (!verificationData.codeExpiresAt || new Date(verificationData.codeExpiresAt) < new Date()) {
      throw new HttpException('인증 코드가 만료되었습니다.', HttpStatus.BAD_REQUEST);
    }

    if (verificationData.verificationCode !== code) {
      return false;
    }

    // Update verification status
    await this.updateVerificationStatus(verificationId, 'APPROVED', '인증이 완료되었습니다.');

    return true;
  }

  /**
   * 인증 상태 업데이트
   */
  private async updateVerificationStatus(
    verificationId: string,
    status: VerificationStatus,
    reviewNotes?: string
  ): Promise<void> {
    const verification = await this.prismaService.companyVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) return;

    const verificationData = {
      ...(verification.data as any || {}),
      reviewNotes,
      lastUpdated: new Date().toISOString(),
    };

    await this.prismaService.companyVerification.update({
      where: { id: verificationId },
      data: {
        status,
        data: JSON.stringify(verificationData),
        reviewedAt: new Date(),
      },
    });

    // Clear cache
    await this.cacheService.delete(`company_verification:${verificationId}`);
  }

  /**
   * 사용자의 최신 인증 상태 조회
   */
  async getVerificationStatus(userId: string): Promise<any> {
    const cacheKey = `user_verification_status:${userId}`;
    
    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const latestVerification = await this.prismaService.companyVerification.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      include: { company: true },
    });

    if (latestVerification) {
      await this.cacheService.set(cacheKey, latestVerification, { ttl: 300 }); // Cache for 5 minutes
    }

    return latestVerification;
  }

  /**
   * 사용자의 특정 회사 인증 여부 확인
   */
  async isUserVerifiedForCompany(userId: string, companyId: string): Promise<boolean> {
    const cacheKey = `user_company_verified:${userId}:${companyId}`;
    
    // Try cache first
    const cached = await this.cacheService.get<boolean>(cacheKey);
    if (cached !== null) return cached;

    const verification = await this.prismaService.companyVerification.findFirst({
      where: {
        userId,
        companyId,
        status: 'APPROVED',
      },
    });

    const isVerified = !!verification;
    await this.cacheService.set(cacheKey, isVerified, { ttl: 3600 }); // Cache for 1 hour

    return isVerified;
  }

  /**
   * 인증 재시도 요청
   */
  async retryVerification(userId: string, verificationId: string): Promise<any> {
    const verification = await this.prismaService.companyVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification || verification.userId !== userId) {
      throw new HttpException('인증 정보를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (verification.status === 'PENDING') {
      throw new HttpException('아직 처리 중인 인증입니다.', HttpStatus.BAD_REQUEST);
    }

    if (verification.status === 'APPROVED') {
      throw new HttpException('이미 승인된 인증입니다.', HttpStatus.BAD_REQUEST);
    }

    // Update status back to PENDING
    await this.prismaService.companyVerification.update({
      where: { id: verificationId },
      data: {
        status: 'PENDING',
        reviewedAt: null,
      },
    });

    // Re-process based on method
    const data = verification.data as any || {};
    switch (verification.method) {
      case 'EMAIL_DOMAIN':
        await this.processEmailVerification(verification.id, data.email);
        break;
      case 'OCR_VERIFICATION':
        await this.processOCRVerification(verification.id, data.imageUrl, data.documentType);
        break;
    }

    return verification;
  }

  /**
   * 회사별 인증된 사용자 수 조회
   */
  async getVerifiedUserCountByCompany(companyId: string): Promise<number> {
    const cacheKey = `company_verified_users:${companyId}`;
    
    const cached = await this.cacheService.get<number>(cacheKey);
    if (cached !== null) return cached;

    const count = await this.prismaService.companyVerification.count({
      where: {
        companyId,
        status: 'APPROVED',
      },
      // distinct: ['userId'],
    });

    await this.cacheService.set(cacheKey, count, { ttl: 600 }); // Cache for 10 minutes

    return count;
  }

  /**
   * 수동 검토가 필요한 인증 목록 조회 (관리자용)
   */
  async getPendingManualReviews(limit: number = 20): Promise<any[]> {
    return this.prismaService.companyVerification.findMany({
      where: {
        status: 'PENDING',
        // data: {
        //   // contains: '"ocrResult"',
        //   not: null,
        // },
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            // email: true,
          },
        },
        company: true,
      },
      orderBy: {
        submittedAt: 'asc',
      },
      take: limit,
    });
  }

  /**
   * 수동 검토 처리 (관리자용)
   */
  async processManualReview(
    verificationId: string,
    approved: boolean,
    reviewNotes: string,
    reviewerId: string
  ): Promise<void> {
    const status = approved ? 'APPROVED' : 'REJECTED';
    
    const verification = await this.prismaService.companyVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new HttpException('인증 정보를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    const verificationData = {
      ...(verification.data as any || {}),
      reviewerId,
      reviewNotes,
      manuallyReviewed: true,
      reviewedAt: new Date().toISOString(),
    };

    await this.prismaService.companyVerification.update({
      where: { id: verificationId },
      data: {
        status,
        data: JSON.stringify(verificationData),
        reviewedAt: new Date(),
      },
    });

    // Clear related caches
    await this.cacheService.delete(`user_verification_status:${verification.userId}`);
    await this.cacheService.delete(`user_company_verified:${verification.userId}:${verification.companyId}`);
    await this.cacheService.delete(`company_verified_users:${verification.companyId}`);
  }
}