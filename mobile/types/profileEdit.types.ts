/**
 * 프로필 편집 화면 타입 정의
 */

import { Gender } from '@/types/interest';

/**
 * 프로필 편집 폼 데이터
 */
export interface ProfileEditFormData {
  // 기본 정보
  nickname: string;
  realName: string;
  gender: Gender | null;
  birthdate: string;
  bio: string;
  
  // 연락처 정보
  email: string;
  phoneNumber: string;
  
  // 소셜 계정
  socialIds: Array<{ platform: string; id: string }>;
  platformIds: Array<{ platform: string; id: string }>;
  gameIds: Array<{ game: string; id: string }>;
  
  // 직업/학업 정보
  companyName: string;
  school: string;
  major: string;
  department: string;
  studentId: string;
  
  // 알바 정보
  partTimeJob: {
    place: string;
    position: string;
    workingHours: string;
  };
  
  // 기타 정보
  location: string;
  appearance: string;
  hobbies: string;
  groups: string[];
}

/**
 * 프로필 편집 화면 토글 상태
 */
export interface ProfileEditToggles {
  showSocialIds: boolean;
  showPlatformIds: boolean;
  showGameIds: boolean;
  showPartTimeJob: boolean;
  showGroups: boolean;
}

/**
 * 소셜 아이템 타입
 */
export type SocialItem = { platform: string; id: string };
export type GameItem = { game: string; id: string };