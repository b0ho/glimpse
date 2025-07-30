import { Like, Match, AnonymousUserInfo } from '@/types';

export interface LikeState {
  // State
  sentLikes: Like[];
  receivedLikes: Like[];
  matches: Match[];
  
  // Daily limits
  dailyLikesUsed: number;
  lastResetDate: string; // ISO date string
  
  // Premium features
  hasPremium: boolean;
  premiumLikesRemaining: number;
  
  // Super Likes (Premium only)
  superLikesUsed: number;
  dailySuperLikesLimit: number; // 일일 슈퍼 좋아요 제한 (프리미엄 사용자만)
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

export interface LikeStore extends LikeState {
  // Actions
  sendLike: (toUserId: string, groupId: string) => Promise<boolean>;
  sendSuperLike: (toUserId: string, groupId: string) => Promise<boolean>; // 슈퍼 좋아요 전용
  createMatch: (match: Match) => void;
  setSentLikes: (likes: Like[]) => void;
  setReceivedLikes: (likes: Like[]) => void;
  setMatches: (matches: Match[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Premium actions
  purchasePremiumLikes: (count: number) => void;
  setPremiumStatus: (hasPremium: boolean) => void;
  syncWithPremiumStore: () => void;
  
  // Super Like actions
  canSendSuperLike: () => boolean;
  getRemainingSuperLikes: () => number;
  
  // Rewind actions (Premium only)
  canRewindLike: () => boolean;
  rewindLastLike: () => Promise<boolean>;
  getLastLike: () => Like | null;
  
  // Computed values
  canSendLike: (toUserId: string) => boolean;
  getRemainingFreeLikes: () => number;
  hasLikedUser: (userId: string) => boolean;
  isSuperLikedUser: (userId: string) => boolean;
  isMatchedWith: (userId: string) => boolean;
  getReceivedLikesCount: () => number;
  
  // Anonymity system
  getAnonymousUserInfo: (userId: string, currentUserId: string) => AnonymousUserInfo | null;
  getUserDisplayName: (userId: string, currentUserId: string) => string;
  
  // Location-based matching
  getLocationBasedMatches: (userLocation?: { latitude: number; longitude: number }) => Array<{
    id: string;
    nickname: string;
    distance: number;
    commonGroups: number;
    matchingScore: number;
    lastActive: Date;
    locationScore: number;
  }>;
  calculateLocationMatchingScore: (userId: string, userLocation?: { latitude: number; longitude: number }) => number;
  
  // Daily reset
  resetDailyLimits: () => void;
  checkAndResetDaily: () => void;
}

export interface LocationMatchScore {
  id: string;
  nickname: string;
  distance: number;
  commonGroups: number;
  matchingScore: number;
  lastActive: Date;
  locationScore: number;
}