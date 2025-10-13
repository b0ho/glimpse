/**
 * 사용자 관련 타입 정의
 */

import { AppMode, PremiumLevel } from './common.types';

/**
 * 성별 타입
 */
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

/**
 * 사용자 인터페이스 - 모든 사용자 정보를 포함하는 기본 타입
 */
export interface User {
  id: string;
  clerkId?: string;
  anonymousId: string;
  phoneNumber: string;
  phone?: string; // For compatibility with mock data
  nickname?: string;
  realName?: string; // Real name (revealed after matching)
  age?: number;
  gender?: Gender;
  profileImage?: string;
  profileImageUrl?: string; // For compatibility with mock data
  bio?: string;
  isVerified: boolean;
  credits: number;
  isPremium: boolean;
  premiumLevel?: PremiumLevel;
  premiumUntil?: Date;
  isAdmin?: boolean;
  currentMode?: AppMode;
  lastActive: Date;
  lastActiveAt?: Date; // For compatibility with mock data
  lastOnline?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Additional profile fields
  companyName?: string;
  education?: string;
  location?: string;
  interests?: string[];
  height?: number;
  mbti?: string;
  drinking?: string;
  smoking?: string;
  
  // 12종 유형 정보
  email?: string;
  socialIds?: {
    platform: string;
    id: string;
  }[];
  school?: string;
  major?: string;
  department?: string;
  studentId?: string;
  partTimeJob?: {
    place: string;
    position?: string;
    workingHours?: string;
  };
  platformIds?: {
    platform: string;
    id: string;
  }[];
  gameIds?: {
    game: string;
    id: string;
  }[];
  birthdate?: string;
  appearance?: string;
  hobbies?: string;
  phoneNumberCountryCode?: string;
  phoneNumberNational?: string;
  hasStory?: boolean;
  storyExpiresAt?: Date;

  // Relationships
  groups?: string[];
  privacySettings?: PrivacySettings;
  notificationSettings?: any;
}

/**
 * 사용자 생성 요청
 */
export interface UserCreateRequest {
  phoneNumber: string;
  nickname?: string;
  age?: number;
  gender?: Gender;
  bio?: string;
}

/**
 * 사용자 업데이트 요청
 */
export interface UserUpdateRequest {
  nickname?: string;
  realName?: string;
  age?: number;
  gender?: Gender;
  profileImage?: string;
  bio?: string;
  companyName?: string;
  education?: string;
  location?: string;
  interests?: string[];
  height?: number;
  mbti?: string;
  drinking?: string;
  smoking?: string;
  email?: string;
  socialIds?: {
    platform: string;
    id: string;
  }[];
  school?: string;
  major?: string;
  partTimeJob?: {
    place: string;
    position?: string;
    workingHours?: string;
  };
  platformIds?: {
    platform: string;
    id: string;
  }[];
  gameIds?: {
    game: string;
    id: string;
  }[];
  birthdate?: string;
  appearance?: string;
  hobbies?: string;
}

/**
 * 사용자 응답
 */
export interface UserResponse extends User {
  token?: string;
  isNewUser?: boolean;
}

/**
 * 익명 사용자 정보
 */
export interface AnonymousUserInfo {
  id?: string;
  anonymousId: string;
  displayName?: string;
  nickname?: string;
  realName?: string;
  profileImage?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  isMatched?: boolean;
  gender?: string;
}

/**
 * 익명 ID를 포함한 사용자
 */
export interface UserWithAnonymousId extends User {
  displayId: string;
  isAnonymous: boolean;
}

/**
 * 근처 사용자
 */
export interface NearbyUser extends User {
  distance: number;
  lastLocationUpdate: Date;
  isVisible: boolean;
  persona?: {
    bio?: string;
    interests?: string[];
    ageRange?: string;
    occupation?: string;
  };
  mutualGroups?: string[];
}

/**
 * 프로필 업데이트 데이터
 */
export interface UpdateProfileData {
  nickname?: string;
  bio?: string;
  age?: number;
  gender?: Gender;
  interests?: string[];
  profileImage?: string;
  height?: number;
  mbti?: string;
  drinking?: string;
  smoking?: string;
}

/**
 * 프로필 업데이트 응답
 */
export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  user?: User;
}

/**
 * 사용자 디바이스 토큰
 */
export interface UserDeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 프라이버시 설정
 */
export interface PrivacySettings {
  showProfile: boolean;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowDirectMessages: boolean;
  allowFriendRequests?: boolean;
  blockList: string[];
}