import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { EmailService } from '../core/email/email.service';
import { CompanyDomain, EmailVerification } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * 회사 도메인 서비스 - 회사/학교 이메일 도메인 관리 및 인증
 */
@Injectable()
export class CompanyDomainService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * 이메일로 회사 도메인 정보 조회
   */
  async getDomainByEmail(email: string): Promise<CompanyDomain | null> {
    const domain = email.split('@')[1];
    if (!domain) return null;

    return this.prisma.companyDomain.findUnique({
      where: { domain },
    });
  }

  /**
   * 이메일 인증 생성 및 인증 코드 전송
   */
  async createEmailVerification(
    userId: string,
    email: string,
  ): Promise<EmailVerification> {
    const domain = email.split('@')[1];
    if (!domain) {
      throw new Error('유효하지 않은 이메일 형식입니다.');
    }

    // 회사 도메인 확인
    const companyDomain = await this.getDomainByEmail(email);
    if (!companyDomain) {
      throw new Error('등록되지 않은 회사/학교 도메인입니다.');
    }

    // 기존 인증 확인
    const existingVerification = await this.prisma.emailVerification.findUnique(
      {
        where: {
          userId_email: {
            userId,
            email,
          },
        },
      },
    );

    if (existingVerification?.isVerified) {
      throw new Error('이미 인증된 이메일입니다.');
    }

    // 인증 코드 생성
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30분 후 만료

    const verification = await this.prisma.emailVerification.upsert({
      where: {
        userId_email: {
          userId,
          email,
        },
      },
      update: {
        code,
        expiresAt,
        attempts: 0,
        isVerified: false,
      },
      create: {
        userId,
        email,
        domain,
        code,
        expiresAt,
      },
    });

    // 이메일 전송
    const htmlContent = `
      <h2>안녕하세요!</h2>
      <p>${companyDomain.companyNameKr || companyDomain.companyName} 이메일 인증을 위한 코드입니다.</p>
      <h3 style="color: #4A90E2;">인증 코드: ${code}</h3>
      <p>이 코드는 30분 후 만료됩니다.</p>
      <br>
      <p>감사합니다.<br>Glimpse 팀</p>
    `;

    await this.emailService.sendEmail({
      to: email,
      subject: `[Glimpse] ${companyDomain.companyNameKr || companyDomain.companyName} 이메일 인증`,
      html: htmlContent,
      text: `안녕하세요!\n\n${companyDomain.companyNameKr || companyDomain.companyName} 이메일 인증을 위한 코드입니다.\n\n인증 코드: ${code}\n\n이 코드는 30분 후 만료됩니다.\n\n감사합니다.\nGlimpse 팀`,
    });

    return verification;
  }

  /**
   * 이메일 인증 코드 검증
   */
  async verifyEmailCode(
    userId: string,
    email: string,
    code: string,
  ): Promise<boolean> {
    const verification = await this.prisma.emailVerification.findUnique({
      where: {
        userId_email: {
          userId,
          email,
        },
      },
    });

    if (!verification) {
      throw new Error('인증 요청을 찾을 수 없습니다.');
    }

    if (verification.isVerified) {
      throw new Error('이미 인증된 이메일입니다.');
    }

    if (verification.attempts >= verification.maxAttempts) {
      throw new Error('인증 시도 횟수를 초과했습니다.');
    }

    if (verification.expiresAt < new Date()) {
      throw new Error('인증 코드가 만료되었습니다.');
    }

    // 시도 횟수 증가
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { attempts: verification.attempts + 1 },
    });

    if (verification.code !== code) {
      throw new Error('잘못된 인증 코드입니다.');
    }

    // 인증 성공
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    // 회사 도메인 정보 가져오기
    const companyDomain = await this.getDomainByEmail(email);

    if (companyDomain) {
      // 회사 그룹 자동 가입 처리
      await this.joinCompanyGroup(userId, companyDomain);
    }

    return true;
  }

  /**
   * 회사 그룹 자동 가입 처리
   */
  private async joinCompanyGroup(userId: string, companyDomain: CompanyDomain) {
    // 회사와 연결된 공식 그룹 찾기
    const company = await this.prisma.company.findUnique({
      where: { domain: companyDomain.domain },
      include: { groups: { where: { type: 'OFFICIAL' } } },
    });

    if (company && company.groups.length > 0) {
      const officialGroup = company.groups[0];

      if (officialGroup) {
        // 그룹 멤버로 추가
        await this.prisma.groupMember.upsert({
          where: {
            userId_groupId: {
              userId,
              groupId: officialGroup.id,
            },
          },
          update: {
            status: 'ACTIVE',
          },
          create: {
            userId,
            groupId: officialGroup.id,
            role: 'MEMBER',
            status: 'ACTIVE',
          },
        });
      }
    }
  }

  /**
   * 6자리 인증 코드 생성
   */
  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * 회사 도메인 추가
   */
  async addCompanyDomain(data: {
    domain: string;
    companyName: string;
    companyNameKr?: string;
    employeeCount?: number;
    industry?: string;
    logoUrl?: string;
  }): Promise<CompanyDomain> {
    // 도메인 중복 확인
    const existing = await this.prisma.companyDomain.findUnique({
      where: { domain: data.domain },
    });

    if (existing) {
      throw new Error('이미 등록된 도메인입니다.');
    }

    return this.prisma.companyDomain.create({
      data,
    });
  }

  /**
   * 인증된 도메인 목록 조회
   */
  async getVerifiedDomains(): Promise<CompanyDomain[]> {
    return this.prisma.companyDomain.findMany({
      where: { isVerified: true },
      orderBy: { companyName: 'asc' },
    });
  }

  /**
   * 도메인 검색
   */
  async searchDomains(query: string): Promise<CompanyDomain[]> {
    return this.prisma.companyDomain.findMany({
      where: {
        OR: [
          { domain: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
          { companyNameKr: { contains: query, mode: 'insensitive' } },
        ],
        isVerified: true,
      },
      take: 20,
      orderBy: { companyName: 'asc' },
    });
  }
}
