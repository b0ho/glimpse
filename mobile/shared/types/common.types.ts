/**
 * 공통 타입 정의
 */

/**
 * 앱 모드 타입
 */
export enum AppMode {
  DATING = 'DATING',
  FRIENDSHIP = 'FRIENDSHIP'
}

/**
 * 관계 의도 타입
 */
export enum RelationshipIntent {
  FRIEND = 'FRIEND',
  ROMANTIC = 'ROMANTIC'
}

/**
 * 프리미엄 레벨
 */
export enum PremiumLevel {
  FREE = 'FREE',
  BASIC = 'BASIC',
  UPPER = 'UPPER'
}

/**
 * API 응답 타입
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorCode?: string;
  timestamp?: string;
  path?: string;
  statusCode?: number;
  errors?: {
    field: string;
    message: string;
  }[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 모드별 텍스트
 */
export interface ModeTexts {
  title: string;
  subtitle: string;
  likeButton: string;
  matchMessage: string;
  noMoreProfiles: string;
}