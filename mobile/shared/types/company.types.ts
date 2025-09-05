/**
 * 회사 관련 타입 정의
 */

/**
 * 회사
 */
export interface Company {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  employeeCount?: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 회사 인증
 */
export interface CompanyVerification {
  id: string;
  userId: string;
  companyId: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationMethod: 'EMAIL' | 'DOCUMENT';
  documentUrl?: string;
  rejectionReason?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}