import { API_BASE_URL } from './api/config';
// import { authService } from './auth/auth-service'; // TODO: Implement token handling

/**
 * 회사 도메인 인터페이스
 * @interface CompanyDomain
 * @description 회사 이메일 도메인 정보
 */
export interface CompanyDomain {
  /** 도메인 ID */
  id: string;
  /** 이메일 도메인 (예: naver.com) */
  domain: string;
  /** 회사명 (영문) */
  companyName: string;
  /** 회사명 (한글) */
  companyNameKr?: string;
  /** 인증 완료 여부 */
  isVerified: boolean;
  /** 직원 수 */
  employeeCount?: number;
  /** 산업 분야 */
  industry?: string;
  /** 회사 로고 URL */
  logoUrl?: string;
}

/**
 * 이메일 인증 정보 인터페이스
 * @interface EmailVerification
 * @description 이메일 인증 요청 정보
 */
export interface EmailVerification {
  /** 인증 요청한 이메일 */
  email: string;
  /** 인증 만료 시간 */
  expiresAt: string;
}

/**
 * 회사 인증 서비스 클래스
 * @class CompanyVerificationService
 * @description 회사 이메일 도메인 인증 및 검색 기능 제공
 */
class CompanyVerificationService {
  /**
   * 회사 도메인 검색
   * @async
   * @param {string} query - 검색어 (회사명 또는 도메인)
   * @returns {Promise<CompanyDomain[]>} 검색된 회사 도메인 목록
   * @throws {Error} 검색 실패 시
   * @description 회사명이나 도메인으로 등록된 회사를 검색
   */
  async searchCompanyDomains(query: string): Promise<CompanyDomain[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/company/domains/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('도메인 검색 실패');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('회사 도메인 검색 오류:', error);
      throw error;
    }
  }

  /**
   * 인증된 도메인 목록 조회
   * @async
   * @returns {Promise<CompanyDomain[]>} 인증된 회사 도메인 목록
   * @throws {Error} 조회 실패 시
   * @description 시스템에 등록된 모든 인증된 회사 도메인 목록을 가져오기
   */
  async getVerifiedDomains(): Promise<CompanyDomain[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/company/domains`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('도메인 목록 가져오기 실패');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('인증된 도메인 가져오기 오류:', error);
      throw error;
    }
  }

  /**
   * 인증 이메일 발송
   * @async
   * @param {string} email - 인증할 회사 이메일 주소
   * @returns {Promise<EmailVerification>} 이메일 인증 정보
   * @throws {Error} 이메일 발송 실패 시
   * @description 회사 이메일로 인증 코드를 발송
   */
  async sendVerificationEmail(email: string): Promise<EmailVerification> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }

      const response = await fetch(`${API_BASE_URL}/company/verify/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '이메일 전송 실패');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('인증 이메일 전송 오류:', error);
      throw error;
    }
  }

  /**
   * 이메일 인증 코드 확인
   * @async
   * @param {string} email - 인증할 이메일 주소
   * @param {string} code - 인증 코드
   * @returns {Promise<boolean>} 인증 성공 여부
   * @throws {Error} 인증 실패 시
   * @description 이메일로 전송된 인증 코드를 확인하여 회사 소속 인증
   */
  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }

      const response = await fetch(`${API_BASE_URL}/company/verify/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '인증 실패');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('이메일 인증 코드 검증 오류:', error);
      throw error;
    }
  }

  /**
   * 이메일 유효성 검사
   * @param {string} email - 검사할 이메일 주소
   * @returns {boolean} 유효한 이메일 형식 여부
   * @description 이메일 주소가 올바른 형식인지 검증
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 이메일에서 도메인 추출
   * @param {string} email - 이메일 주소
   * @returns {string | null} 도메인 또는 null
   * @description 이메일 주소에서 @ 뒤의 도메인 부분을 추출
   * @example
   * extractDomain('user@naver.com') // 'naver.com'
   */
  extractDomain(email: string): string | null {
    const parts = email.split('@');
    if (parts.length === 2) {
      return parts[1];
    }
    return null;
  }

  /**
   * 회사명 포맷팅
   * @param {CompanyDomain} domain - 회사 도메인 정보
   * @returns {string} 포맷팅된 회사명
   * @description 한글/영문 회사명을 적절한 형식으로 표시
   * @example
   * formatCompanyName({companyNameKr: '네이버', companyName: 'NAVER'}) // '네이버 (NAVER)'
   */
  formatCompanyName(domain: CompanyDomain): string {
    if (domain.companyNameKr) {
      return `${domain.companyNameKr} (${domain.companyName})`;
    }
    return domain.companyName;
  }
}

/**
 * 회사 인증 서비스 싱글톤 인스턴스
 * @constant {CompanyVerificationService}
 * @description 앱 전체에서 사용할 회사 인증 서비스 인스턴스
 */
export const companyVerificationService = new CompanyVerificationService();