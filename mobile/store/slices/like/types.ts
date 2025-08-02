/**
 * 좋아요 기능 타입 정의
 * @module like/types
 * @description 좋아요 스토어에서 사용하는 타입 정의
 */

import { Like, Match, AnonymousUserInfo } from '@/types';

/**
 * 좋아요 상태 인터페이스
 * @interface LikeState
 * @description 좋아요 관련 상태 정보
 */
export interface LikeState {
  // State
  /** 보낸 좋아요 목록 */
  sentLikes: Like[];
  /** 받은 좋아요 목록 */
  receivedLikes: Like[];
  /** 매칭 목록 */
  matches: Match[];
  
  // Daily limits
  /** 오늘 사용한 좋아요 수 */
  dailyLikesUsed: number;
  /** 마지막 리셋 날짜 (ISO 문자열) */
  lastResetDate: string;
  
  // Premium features
  /** 프리미엄 구독 여부 */
  hasPremium: boolean;
  /** 남은 프리미엄 좋아요 수 */
  premiumLikesRemaining: number;
  
  // Super Likes (Premium only)
  /** 사용한 슈퍼 좋아요 수 */
  superLikesUsed: number;
  /** 일일 슈퍼 좋아요 제한 (프리미엄 사용자만) */
  dailySuperLikesLimit: number;
  
  // UI state
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
}

/**
 * 좋아요 스토어 인터페이스
 * @interface LikeStore
 * @description 좋아요 상태와 액션을 포함한 전체 스토어
 */
export interface LikeStore extends LikeState {
  // Actions
  /** 좋아요 전송 */
  sendLike: (toUserId: string, groupId: string) => Promise<boolean>;
  /** 슈퍼 좋아요 전송 (프리미엄 전용) */
  sendSuperLike: (toUserId: string, groupId: string) => Promise<boolean>;
  /** 매칭 생성 */
  createMatch: (match: Match) => void;
  /** 보낸 좋아요 목록 설정 */
  setSentLikes: (likes: Like[]) => void;
  /** 받은 좋아요 목록 설정 */
  setReceivedLikes: (likes: Like[]) => void;
  /** 매칭 목록 설정 */
  setMatches: (matches: Match[]) => void;
  /** 로딩 상태 설정 */
  setLoading: (isLoading: boolean) => void;
  /** 에러 설정 */
  setError: (error: string | null) => void;
  
  // Premium actions
  /** 프리미엄 좋아요 구매 */
  purchasePremiumLikes: (count: number) => void;
  /** 프리미엄 상태 설정 */
  setPremiumStatus: (hasPremium: boolean) => void;
  /** 프리미엄 스토어와 동기화 */
  syncWithPremiumStore: () => void;
  
  // Super Like actions
  /** 슈퍼 좋아요 전송 가능 여부 */
  canSendSuperLike: () => boolean;
  /** 남은 슈퍼 좋아요 수 */
  getRemainingSuperLikes: () => number;
  
  // Rewind actions (Premium only)
  /** 좋아요 되돌리기 가능 여부 */
  canRewindLike: () => boolean;
  /** 마지막 좋아요 되돌리기 */
  rewindLastLike: () => Promise<boolean>;
  /** 마지막 좋아요 가져오기 */
  getLastLike: () => Like | null;
  
  // Computed values
  /** 좋아요 전송 가능 여부 */
  canSendLike: (toUserId: string) => boolean;
  /** 남은 무료 좋아요 수 */
  getRemainingFreeLikes: () => number;
  /** 특정 사용자에게 좋아요 했는지 확인 */
  hasLikedUser: (userId: string) => boolean;
  /** 특정 사용자에게 슈퍼 좋아요 했는지 확인 */
  isSuperLikedUser: (userId: string) => boolean;
  /** 특정 사용자와 매칭되었는지 확인 */
  isMatchedWith: (userId: string) => boolean;
  /** 받은 좋아요 수 */
  getReceivedLikesCount: () => number;
  
  // Anonymity system
  /** 익명 사용자 정보 가져오기 */
  getAnonymousUserInfo: (userId: string, currentUserId: string) => AnonymousUserInfo | null;
  /** 사용자 표시 이름 가져오기 */
  getUserDisplayName: (userId: string, currentUserId: string) => string;
  
  // Location-based matching
  /** 위치 기반 매칭 목록 가져오기 */
  getLocationBasedMatches: (userLocation?: { latitude: number; longitude: number }) => Array<{
    id: string;
    nickname: string;
    distance: number;
    commonGroups: number;
    matchingScore: number;
    lastActive: Date;
    locationScore: number;
  }>;
  /** 위치 기반 매칭 점수 계산 */
  calculateLocationMatchingScore: (userId: string, userLocation?: { latitude: number; longitude: number }) => number;
  
  // Daily reset
  /** 일일 제한 초기화 */
  resetDailyLimits: () => void;
  /** 일일 리셋 확인 및 처리 */
  checkAndResetDaily: () => void;
}

/**
 * 위치 기반 매칭 점수 인터페이스
 * @interface LocationMatchScore
 * @description 위치 기반 매칭에서 사용하는 점수 정보
 */
export interface LocationMatchScore {
  /** 사용자 ID */
  id: string;
  /** 닉네임 */
  nickname: string;
  /** 거리 (미터) */
  distance: number;
  /** 공통 그룹 수 */
  commonGroups: number;
  /** 매칭 점수 */
  matchingScore: number;
  /** 마지막 활동 시간 */
  lastActive: Date;
  /** 위치 점수 */
  locationScore: number;
}