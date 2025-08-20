/**
 * 관심상대 찾기 관련 타입 정의
 */

export enum InterestType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  SOCIAL_ID = 'SOCIAL_ID',
  NAME = 'NAME',  // 이름으로 찾기
  GROUP = 'GROUP',
  LOCATION = 'LOCATION',
  APPEARANCE = 'APPEARANCE',
  NICKNAME = 'NICKNAME',
  COMPANY = 'COMPANY',
  SCHOOL = 'SCHOOL',
  HOBBY = 'HOBBY',
}

export enum SearchStatus {
  ACTIVE = 'ACTIVE',
  MATCHED = 'MATCHED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface InterestSearch {
  id: string;
  type: InterestType;
  value: string;
  metadata?: Record<string, any>;
  status: SearchStatus;
  matchedWithId?: string;
  matchedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchedUser?: {
    nickname: string;
    profileImage?: string;
  };
}

export interface InterestMatch {
  id?: string; // 매칭 ID
  searchId: string;
  matchedSearchId?: string;
  matchedUserId: string;
  matchedUser: {
    id?: string;
    nickname: string;
    profileImage?: string;
  };
  matchType?: InterestType;
  matchValue?: string;
  matchedAt: Date | string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateInterestSearchDto {
  type: InterestType;
  value: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface UpdateInterestSearchDto {
  status?: SearchStatus;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface GetInterestSearchesQuery {
  type?: InterestType;
  status?: SearchStatus;
}

export interface CheckMatchDto {
  type: InterestType;
  value: string;
}