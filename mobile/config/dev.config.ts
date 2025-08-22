/**
 * 개발 환경 설정
 * @module config/dev.config
 * @description 개발 환경에서 사용할 설정 및 슈퍼 계정 관리
 */

import { User, AppMode } from '../shared/types';

/**
 * 개발 환경인지 확인
 */
export const isDevelopment = true;

/**
 * 개발 모드 인증 우회 활성화 여부
 */
export const isAuthBypassEnabled = false;

/**
 * 슈퍼 계정 정의
 */
export const SUPER_ACCOUNTS: Record<string, User> = {
  // 일반 테스트 계정
  'dev-user': {
    id: 'dev-user-001',
    anonymousId: 'anon-dev-001',
    phoneNumber: '010-1234-5678',
    nickname: '개발테스터',
    profileImage: 'https://via.placeholder.com/150',
    isVerified: true,
    isPremium: false,
    credits: 10,
    currentMode: AppMode.DATING,
    lastActive: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    notificationSettings: {
      likes: true,
      matches: true,
      messages: true,
      friendRequests: true,
    },
    privacySettings: {
      showProfile: true,
      showOnlineStatus: true,
      showLastSeen: false,
      allowFriendRequests: true,
    },
  },
  
  // 프리미엄 테스트 계정
  'premium-user': {
    id: 'cme0xrol20000ura4w0h2fytv', // 실제 DB의 ID로 변경
    anonymousId: 'anon-premium-001',
    phoneNumber: '010-9876-5432',
    nickname: '프리미엄테스터',
    profileImage: 'https://via.placeholder.com/150',
    isVerified: true,
    isPremium: true,
    credits: 999,
    currentMode: AppMode.DATING,
    lastActive: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    notificationSettings: {
      likes: true,
      matches: true,
      messages: true,
      friendRequests: true,
    },
    privacySettings: {
      showProfile: true,
      showOnlineStatus: true,
      showLastSeen: true,
      allowFriendRequests: true,
    },
  },
  
  // 관리자 계정
  'admin-user': {
    id: 'cmektu1y80000xtcgr1a1whj3',
    anonymousId: 'anon-admin-001',
    phoneNumber: '010-0000-0000',
    nickname: '즐거운여우264',
    profileImage: 'https://via.placeholder.com/150',
    isVerified: true,
    isPremium: true,
    isAdmin: true,
    credits: 9999,
    currentMode: AppMode.DATING,
    lastActive: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    notificationSettings: {
      likes: true,
      matches: true,
      messages: true,
      friendRequests: false,
    },
    privacySettings: {
      showProfile: true,
      showOnlineStatus: true,
      showLastSeen: true,
      allowFriendRequests: false,
    },
  },
};

/**
 * 개발 모드 설정
 */
export const DEV_CONFIG = {
  // 기본 슈퍼 계정
  defaultSuperAccount: 'dev-user',
  
  // API 모킹 활성화
  mockApiCalls: false,
  
  // 디버그 로깅 활성화
  enableDebugLogging: isDevelopment,
  
  // 개발 토큰 (실제 DB의 사용자 ID와 매칭되는 JWT)
  devToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWUweHJvbDIwMDAwdXJhNHcwaDJmeXR2Iiwic3ViIjoiY21lMHhyb2wyMDAwMHVyYTR3MGgyZnl0diIsInBob25lTnVtYmVyIjoiKzgyMDEwMTIzNDU2NzgiLCJpc1ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3NTQ1NTU0NjgsImV4cCI6MTc1NzE0NzQ2OH0.T4IX4a4h9eRVak-vooa6wFjVXeu4vtIVrBpqsmJIiw4',
  
  // 개발 세션 ID
  devSessionId: 'dev-session-glimpse',
};

/**
 * 현재 활성 슈퍼 계정 가져오기
 */
export function getCurrentSuperAccount(): User | null {
  if (!isAuthBypassEnabled) return null;
  
  // 웹 환경에서는 localStorage 확인
  let accountType = 'admin-user';
  
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedAccountType = window.localStorage.getItem('DEV_ACCOUNT_TYPE');
    if (storedAccountType && SUPER_ACCOUNTS[storedAccountType]) {
      accountType = storedAccountType;
    }
  }
  
  return SUPER_ACCOUNTS[accountType] || SUPER_ACCOUNTS[DEV_CONFIG.defaultSuperAccount];
}