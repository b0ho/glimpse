import { LIKE_SYSTEM } from '@/utils/constants';
import { SUBSCRIPTION_FEATURES } from '@/types/subscription';
import { LikeState, LocationBasedUser } from '../types/likeTypes';

/**
 * 좋아요 관련 계산 유틸리티 함수들
 */
export const likeCalculations = {
  /**
   * 남은 무료 좋아요 수 계산
   */
  getRemainingFreeLikes: (state: Pick<LikeState, 'dailyLikesUsed' | 'hasPremium'>) => {
    if (state.hasPremium) {
      return 999; // 프리미엄은 무제한
    }
    return Math.max(0, LIKE_SYSTEM.DAILY_FREE_LIKES - state.dailyLikesUsed);
  },

  /**
   * 남은 전체 좋아요 수 계산
   */
  getTotalRemainingLikes: (state: Pick<LikeState, 'dailyLikesUsed' | 'hasPremium' | 'premiumLikesRemaining'>) => {
    const freeLikes = likeCalculations.getRemainingFreeLikes(state);
    return freeLikes + state.premiumLikesRemaining;
  },

  /**
   * 좋아요 가능 여부 확인
   */
  canLike: (state: Pick<LikeState, 'dailyLikesUsed' | 'hasPremium' | 'premiumLikesRemaining'>) => {
    if (state.hasPremium) {
      return true; // 프리미엄은 항상 가능
    }
    return likeCalculations.getTotalRemainingLikes(state) > 0;
  },

  /**
   * 슈퍼 좋아요 가능 여부 확인
   */
  canSendSuperLike: (state: Pick<LikeState, 'hasPremium' | 'superLikesUsed' | 'dailySuperLikesLimit'>) => {
    if (!state.hasPremium) {
      return false;
    }
    return state.superLikesUsed < state.dailySuperLikesLimit;
  },

  /**
   * 남은 슈퍼 좋아요 수 계산
   */
  getRemainingSuperLikes: (state: Pick<LikeState, 'hasPremium' | 'superLikesUsed' | 'dailySuperLikesLimit'>) => {
    if (!state.hasPremium) {
      return 0;
    }
    return Math.max(0, state.dailySuperLikesLimit - state.superLikesUsed);
  },

  /**
   * 좋아요 되돌리기 가능 여부 확인
   */
  canRewindLike: (state: Pick<LikeState, 'hasPremium' | 'sentLikes'>) => {
    if (!state.hasPremium) {
      return false;
    }
    
    const lastLike = state.sentLikes[state.sentLikes.length - 1];
    if (!lastLike) {
      return false;
    }
    
    // 24시간 내의 좋아요만 되돌리기 가능
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(lastLike.createdAt) > twentyFourHoursAgo;
  },

  /**
   * 일일 한도 확인
   */
  checkDailyLimits: (lastResetDate: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return lastResetDate !== today;
  },

  /**
   * 위치 기반 매칭 점수 계산
   */
  calculateLocationMatchingScore: (
    userDistance: number,
    commonGroups: number,
    lastActiveMinutes: number
  ): number => {
    let score = 0.5; // 기본 점수

    // 거리 가중치 (0.3)
    if (userDistance <= 200) {
      score += 0.3;
    } else if (userDistance <= 500) {
      score += 0.2;
    } else if (userDistance <= 1000) {
      score += 0.1;
    }

    // 공통 그룹 가중치 (0.2)
    if (commonGroups >= 2) {
      score += 0.2;
    } else if (commonGroups >= 1) {
      score += 0.1;
    }

    // 최근 활동 가중치 (0.1)
    if (lastActiveMinutes <= 10) {
      score += 0.1;
    } else if (lastActiveMinutes <= 30) {
      score += 0.05;
    }

    return Math.min(1.0, score);
  },

  /**
   * 위치 기반 사용자 정렬
   */
  sortLocationBasedUsers: (users: LocationBasedUser[]): LocationBasedUser[] => {
    return users.sort((a, b) => (b.locationScore || 0) - (a.locationScore || 0));
  },

  /**
   * 익명 사용자 이름 생성
   */
  generateAnonymousName: (userId: string): string => {
    const anonymousNames = [
      '비밀친구',
      '익명의 누군가',
      '숨은 매력',
      '미스터리 사용자',
      '시크릿 친구'
    ];
    const index = userId.charCodeAt(0) % anonymousNames.length;
    return anonymousNames[index];
  },

  /**
   * 프리미엄 구독자 일일 슈퍼 좋아요 한도
   */
  getDailySuperLikesLimit: (subscriptionTier?: string): number => {
    switch (subscriptionTier) {
      case 'premium':
        return SUBSCRIPTION_FEATURES.premium.superLikes;
      case 'plus':
        return SUBSCRIPTION_FEATURES.plus.superLikes;
      default:
        return 0;
    }
  }
};