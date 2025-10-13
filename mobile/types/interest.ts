/**
 * 관심상대 찾기 관련 타입 정의
 */

import { Gender } from '../shared/types/user.types';

export type { Gender };

export enum InterestType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  SOCIAL_ID = 'SOCIAL_ID',
  BIRTHDATE = 'BIRTHDATE',  // 생년월일로 찾기
  GROUP = 'GROUP',
  LOCATION = 'LOCATION',  // 장소 + 인상착의
  NICKNAME = 'NICKNAME',
  COMPANY = 'COMPANY',
  SCHOOL = 'SCHOOL',
  PART_TIME_JOB = 'PART_TIME_JOB',  // 알바
  PLATFORM = 'PLATFORM',  // 기타 플랫폼 (Discord, Slack 등)
  GAME_ID = 'GAME_ID',    // 게임 아이디
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
  gender?: Gender; // 찾고자 하는 성별
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
  gender?: Gender; // 찾고자 하는 성별
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