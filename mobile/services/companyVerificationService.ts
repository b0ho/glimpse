import { API_BASE_URL } from './api/config';
// import { authService } from './auth/auth-service'; // TODO: Implement token handling

export interface CompanyDomain {
  id: string;
  domain: string;
  companyName: string;
  companyNameKr?: string;
  isVerified: boolean;
  employeeCount?: number;
  industry?: string;
  logoUrl?: string;
}

export interface EmailVerification {
  email: string;
  expiresAt: string;
}

class CompanyVerificationService {
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

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  extractDomain(email: string): string | null {
    const parts = email.split('@');
    if (parts.length === 2) {
      return parts[1];
    }
    return null;
  }

  formatCompanyName(domain: CompanyDomain): string {
    if (domain.companyNameKr) {
      return `${domain.companyNameKr} (${domain.companyName})`;
    }
    return domain.companyName;
  }
}

export const companyVerificationService = new CompanyVerificationService();