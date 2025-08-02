import { prisma } from '../config/database';
import { CompanyDomain, EmailVerification } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { EmailService } from './EmailService';
import crypto from 'crypto';

/**
 * 회사 도메인 서비스 - 회사/학교 이메일 도메인 관리 및 인증
 * @class CompanyDomainService
 */
export class CompanyDomainService {
  /** 싱글턴 인스턴스 */
  private static instance: CompanyDomainService;
  /** 이메일 서비스 인스턴스 */
  private emailService: EmailService;

  /**
   * CompanyDomainService 생성자
   * @private
   */
  private constructor() {
    this.emailService = EmailService.getInstance();
  }

  /**
   * 싱글턴 인스턴스 반환
   * @returns {CompanyDomainService} CompanyDomainService 인스턴스
   */
  static getInstance(): CompanyDomainService {
    if (!CompanyDomainService.instance) {
      CompanyDomainService.instance = new CompanyDomainService();
    }
    return CompanyDomainService.instance;
  }

  /**
   * 이메일로 회사 도메인 정보 조회
   * @param {string} email - 이메일 주소
   * @returns {Promise<CompanyDomain | null>} 회사 도메인 정보 또는 null
   */
  async getDomainByEmail(email: string): Promise<CompanyDomain | null> {
    const domain = email.split('@')[1];
    if (!domain) return null;

    return prisma.companyDomain.findUnique({
      where: { domain }
    });
  }

  /**
   * 이메일 인증 생성 및 인증 코드 전송
   * @param {string} userId - 사용자 ID
   * @param {string} email - 인증할 이메일 주소
   * @returns {Promise<EmailVerification>} 생성된 이메일 인증 정보
   * @throws {Error} 유효하지 않은 이메일 형식, 등록되지 않은 도메인, 이미 인증된 이메일
   */
  async createEmailVerification(userId: string, email: string): Promise<EmailVerification> {
    const domain = email.split('@')[1];
    if (!domain) {
      throw createError(400, '유효하지 않은 이메일 형식입니다.');
    }

    // 회사 도메인 확인
    const companyDomain = await this.getDomainByEmail(email);
    if (!companyDomain) {
      throw createError(404, '등록되지 않은 회사/학교 도메인입니다.');
    }

    // 기존 인증 확인
    const existingVerification = await prisma.emailVerification.findUnique({
      where: {
        userId_email: {
          userId,
          email
        }
      }
    });

    if (existingVerification?.isVerified) {
      throw createError(400, '이미 인증된 이메일입니다.');
    }

    // 인증 코드 생성
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30분 후 만료

    const verification = await prisma.emailVerification.upsert({
      where: {
        userId_email: {
          userId,
          email
        }
      },
      update: {
        code,
        expiresAt,
        attempts: 0,
        isVerified: false
      },
      create: {
        userId,
        email,
        domain,
        code,
        expiresAt
      }
    });

    // 이메일 전송
    await this.emailService.sendVerificationEmail(email, code, companyDomain.companyNameKr || companyDomain.companyName);

    return verification;
  }

  /**
   * 이메일 인증 코드 검증
   * @param {string} userId - 사용자 ID
   * @param {string} email - 이메일 주소
   * @param {string} code - 인증 코드
   * @returns {Promise<boolean>} 인증 성공 여부
   * @throws {Error} 인증 요청 없음, 이미 인증됨, 시도 횟수 초과, 만료됨, 잘못된 코드
   */
  async verifyEmailCode(userId: string, email: string, code: string): Promise<boolean> {
    const verification = await prisma.emailVerification.findUnique({
      where: {
        userId_email: {
          userId,
          email
        }
      }
    });

    if (!verification) {
      throw createError(404, '인증 요청을 찾을 수 없습니다.');
    }

    if (verification.isVerified) {
      throw createError(400, '이미 인증된 이메일입니다.');
    }

    if (verification.attempts >= verification.maxAttempts) {
      throw createError(429, '인증 시도 횟수를 초과했습니다.');
    }

    if (verification.expiresAt < new Date()) {
      throw createError(410, '인증 코드가 만료되었습니다.');
    }

    // 시도 횟수 증가
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { attempts: verification.attempts + 1 }
    });

    if (verification.code !== code) {
      throw createError(400, '잘못된 인증 코드입니다.');
    }

    // 인증 성공
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        isVerified: true,
        verifiedAt: new Date()
      }
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
   * @private
   * @param {string} userId - 사용자 ID
   * @param {CompanyDomain} companyDomain - 회사 도메인 정보
   * @returns {Promise<void>}
   */
  private async joinCompanyGroup(userId: string, companyDomain: CompanyDomain) {
    // 회사와 연결된 공식 그룹 찾기
    const company = await prisma.company.findUnique({
      where: { domain: companyDomain.domain },
      include: { groups: { where: { type: 'OFFICIAL' } } }
    });

    if (company && company.groups.length > 0) {
      const officialGroup = company.groups[0];
      
      if (officialGroup) {
        // 그룹 멤버로 추가
        await prisma.groupMember.upsert({
          where: {
            userId_groupId: {
              userId,
              groupId: officialGroup.id
            }
          },
          update: {
            status: 'ACTIVE'
          },
          create: {
            userId,
            groupId: officialGroup.id,
            role: 'MEMBER',
            status: 'ACTIVE'
          }
        });
      }
    }
  }

  /**
   * 6자리 인증 코드 생성
   * @private
   * @returns {string} 6자리 숫자 인증 코드
   */
  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * 회사 도메인 추가
   * @param {Object} data - 회사 도메인 정보
   * @param {string} data.domain - 도메인 주소
   * @param {string} data.companyName - 회사명 (영문)
   * @param {string} [data.companyNameKr] - 회사명 (한글)
   * @param {number} [data.employeeCount] - 직원 수
   * @param {string} [data.industry] - 산업 분야
   * @param {string} [data.logoUrl] - 로고 URL
   * @returns {Promise<CompanyDomain>} 생성된 회사 도메인
   * @throws {Error} 이미 등록된 도메인
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
    const existing = await prisma.companyDomain.findUnique({
      where: { domain: data.domain }
    });

    if (existing) {
      throw createError(409, '이미 등록된 도메인입니다.');
    }

    return prisma.companyDomain.create({
      data
    });
  }

  /**
   * 인증된 도메인 목록 조회
   * @returns {Promise<CompanyDomain[]>} 인증된 도메인 목록 (회사명 순)
   */
  async getVerifiedDomains(): Promise<CompanyDomain[]> {
    return prisma.companyDomain.findMany({
      where: { isVerified: true },
      orderBy: { companyName: 'asc' }
    });
  }

  /**
   * 도메인 검색
   * @param {string} query - 검색어
   * @returns {Promise<CompanyDomain[]>} 검색 결과 (최대 20개)
   */
  async searchDomains(query: string): Promise<CompanyDomain[]> {
    return prisma.companyDomain.findMany({
      where: {
        OR: [
          { domain: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
          { companyNameKr: { contains: query, mode: 'insensitive' } }
        ],
        isVerified: true
      },
      take: 20,
      orderBy: { companyName: 'asc' }
    });
  }
}

export const companyDomainService = CompanyDomainService.getInstance();