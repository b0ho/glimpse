import { Like, Match } from '@/types';

/**
 * 좋아요 상태 인터페이스
 * @interface LikeState
 * @description 좋아요, 매칭, 일일 한도 등의 상태 정의
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
  /** 마지막 리셋 날짜 (ISO date string) */
  lastResetDate: string;
  
  // Premium features
  /** 프리미엄 구독 여부 */
  hasPremium: boolean;
  /** 남은 프리미엄 좋아요 수 */
  premiumLikesRemaining: number;
  
  // Super Likes (Premium only)
  /** 오늘 사용한 슈퍼 좋아요 수 */
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
 * @extends {LikeState}
 * @description 좋아요 시스템의 모든 액션과 계산된 값 정의
 */
export interface LikeStore extends LikeState {
  // Actions
  /** 일반 좋아요 보내기 */
  sendLike: (toUserId: string, groupId: string) => Promise<boolean>;
  /** 슈퍼 좋아요 보내기 (프리미엄 전용) */
  sendSuperLike: (toUserId: string, groupId: string) => Promise<boolean>;
  /** 매치 생성 */
  createMatch: (match: Match) => void;
  /** 보낸 좋아요 목록 설정 */
  setSentLikes: (likes: Like[]) => void;
  /** 받은 좋아요 목록 설정 */
  setReceivedLikes: (likes: Like[]) => void;
  /** 매치 목록 설정 */
  setMatches: (matches: Match[]) => void;
  /** 로딩 상태 설정 */
  setLoading: (isLoading: boolean) => void;
  /** 에러 메시지 설정 */
  setError: (error: string | null) => void;
  
  // Cancel and history management
  /** 좋아요 취소 (24시간 내) */
  cancelLike: (likeId: string) => Promise<boolean>;
  /** 좋아요 기록 삭제 */
  deleteLikeHistory: (likeIds: string[]) => Promise<boolean>;
  /** 좋아요 목록 새로고침 */
  refreshLikes: () => Promise<void>;
  
  // Premium actions
  /** 프리미엄 좋아요 구매 */
  purchasePremiumLikes: (count: number) => void;
  /** 프리미엄 상태 설정 */
  setPremiumStatus: (hasPremium: boolean) => void;
  /** 프리미엄 스토어와 동기화 */
  syncWithPremiumStore: () => void;
  
  // Super Like actions
  /** 슈퍼 좋아요 가능 여부 확인 */
  canSendSuperLike: () => boolean;
  /** 남은 슈퍼 좋아요 수 */
  getRemainingSuperLikes: () => number;
  
  // Rewind actions (Premium only)
  /** 좋아요 되돌리기 가능 여부 */
  canRewindLike: () => boolean;
  /** 마지막 좋아요 되돌리기 */
  rewindLastLike: () => Promise<boolean>;
  
  // Computation helpers
  /** 좋아요 가능 여부 확인 */
  canLike: () => boolean;
  /** 남은 무료 좋아요 수 */
  getRemainingFreeLikes: () => number;
  /** 남은 전체 좋아요 수 */
  getTotalRemainingLikes: () => number;
  /** 특정 사용자에게 좋아요를 보냈는지 확인 */
  hasLiked: (userId: string) => boolean;
  
  // Daily limits
  /** 일일 한도 리셋 */
  resetDailyLimits: () => void;
  /** 일일 한도 확인 */
  checkDailyLimits: () => void;
  
  // Read marks
  /** 받은 좋아요 읽음 표시 */
  markReceivedLikeAsRead: (likeId: string) => Promise<void>;
  
  // Match management
  /** 매치 언매치 */
  unmatch: (matchId: string) => Promise<boolean>;
  /** 특정 사용자와의 매칭 여부 확인 */
  isMatchedWith: (userId: string) => boolean;
  /** 받은 좋아요 수 조회 */
  getReceivedLikesCount: () => number;
  
  // Anonymous user info
  /** 익명 사용자 정보 조회 */
  getAnonymousUserInfo: (userId: string, currentUserId: string) => {
    id: string;
    anonymousId: string;
    displayName: string;
    nickname: string;
    realName?: string;
    isMatched: boolean;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
  } | null;
  /** 사용자 표시 이름 조회 */
  getUserDisplayName: (userId: string, currentUserId: string) => string;
  
  // Location-based matching
  /** 위치 기반 매칭 조회 */
  getLocationBasedMatches: (userLocation?: { latitude: number; longitude: number }) => any[];
  /** 위치 기반 매칭 점수 계산 */
  calculateLocationMatchingScore: (userId: string, userLocation?: { latitude: number; longitude: number }) => number;
  
  // Clear actions
  /** 스토어 초기화 */
  clear: () => void;
}

/**
 * 익명 사용자 정보
 */
export interface AnonymousUserInfo {
  id: string;
  anonymousId: string;
  displayName: string;
  nickname: string;
  realName?: string;
  isMatched: boolean;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

/**
 * 위치 기반 매칭 사용자
 */
export interface LocationBasedUser {
  id: string;
  nickname: string;
  distance: number;
  commonGroups: number;
  matchingScore: number;
  lastActive: Date;
  locationScore?: number;
}