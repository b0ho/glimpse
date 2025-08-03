/**
 * 좋아요 기능 액션
 * @module like/actions
 * @description 좋아요 전송, 되돌리기, 일일 리셋 등의 액션 함수
 */

import { likeApi } from '../../../services/api/likeApi';
import { Like, Match } from '@/types';
import { LikeState } from './types';
import { canUserSendLike, getTodayDateString } from './utils';
import { LIKE_SYSTEM } from '@/utils/constants';

/**
 * 좋아요 전송 액션
 * @async
 * @function sendLikeAction
 * @param {LikeState} state - 현재 좋아요 상태
 * @param {string} toUserId - 받는 사용자 ID
 * @param {string} groupId - 그룹 ID
 * @param {boolean} [isSuperLike=false] - 슈퍼 좋아요 여부
 * @returns {Promise<{success: boolean, updatedState?: Partial<LikeState>, error?: string}>} 결과
 * @description 좋아요를 전송하고 상태를 업데이트, 매칭 생성
 */
export const sendLikeAction = async (
  state: LikeState,
  toUserId: string,
  groupId: string,
  isSuperLike: boolean = false
): Promise<{
  success: boolean;
  updatedState?: Partial<LikeState>;
  error?: string;
}> => {
  // Validate can send like
  if (!canUserSendLike(
    toUserId,
    state.sentLikes,
    state.dailyLikesUsed,
    state.hasPremium,
    state.premiumLikesRemaining
  )) {
    return {
      success: false,
      error: '좋아요를 보낼 수 없습니다.'
    };
  }

  try {
    const response = await likeApi.sendLike(toUserId, groupId, isSuperLike);
    
    const newLike: Like = {
      id: response.likeId,
      fromUserId: '', // Will be filled by API
      toUserId,
      groupId,
      isAnonymous: true,
      isSuper: isSuperLike,
      createdAt: new Date(),
    };

    const updatedState: Partial<LikeState> = {
      sentLikes: [...state.sentLikes, newLike],
    };

    // Update daily usage
    if (!state.hasPremium) {
      if (state.dailyLikesUsed < LIKE_SYSTEM.DAILY_FREE_LIKES) {
        updatedState.dailyLikesUsed = state.dailyLikesUsed + 1;
      } else {
        updatedState.premiumLikesRemaining = Math.max(0, state.premiumLikesRemaining - 1);
      }
    }

    // Update super like usage
    if (isSuperLike) {
      updatedState.superLikesUsed = state.superLikesUsed + 1;
    }

    // Handle match creation if response indicates match
    if (response.isMatch && response.matchId) {
      const newMatch: Match = {
        id: response.matchId,
        user1Id: '', // Will be filled by API
        user2Id: toUserId,
        groupId,
        status: 'ACTIVE',
        isActive: true,
        lastMessageAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      updatedState.matches = [...(state.matches || []), newMatch];
    }

    return {
      success: true,
      updatedState
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || '좋아요 전송에 실패했습니다.'
    };
  }
};

/**
 * 좋아요 되돌리기 액션
 * @async
 * @function rewindLikeAction
 * @param {LikeState} state - 현재 좋아요 상태
 * @returns {Promise<{success: boolean, updatedState?: Partial<LikeState>, error?: string}>} 결과
 * @description 마지막으로 보낸 좋아요를 취소 (프리미엄 전용)
 */
export const rewindLikeAction = async (
  state: LikeState
): Promise<{
  success: boolean;
  updatedState?: Partial<LikeState>;
  error?: string;
}> => {
  if (!state.hasPremium || state.sentLikes.length === 0) {
    return {
      success: false,
      error: '되돌릴 수 없습니다.'
    };
  }

  const lastLike = state.sentLikes[state.sentLikes.length - 1];
  
  try {
    await likeApi.unlikeUser(lastLike.toUserId, lastLike.groupId);
    
    const updatedState: Partial<LikeState> = {
      sentLikes: state.sentLikes.slice(0, -1),
    };

    // Restore daily usage
    if (!state.hasPremium) {
      if (state.dailyLikesUsed > 0) {
        updatedState.dailyLikesUsed = state.dailyLikesUsed - 1;
      }
    }

    // Restore super like usage
    if (lastLike.isSuper) {
      updatedState.superLikesUsed = Math.max(0, state.superLikesUsed - 1);
    }

    return {
      success: true,
      updatedState
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || '되돌리기에 실패했습니다.'
    };
  }
};

/**
 * 일일 제한 초기화 액션
 * @function resetDailyLimitsAction
 * @param {LikeState} state - 현재 좋아요 상태
 * @returns {Partial<LikeState>} 업데이트된 상태
 * @description 매일 자정에 일일 좋아요 및 슈퍼 좋아요 사용량 초기화
 */
export const resetDailyLimitsAction = (
  state: LikeState
): Partial<LikeState> => {
  return {
    dailyLikesUsed: 0,
    superLikesUsed: 0,
    lastResetDate: getTodayDateString(),
  };
};

/**
 * 프리미엄 좋아요 구매 액션
 * @function purchasePremiumLikesAction
 * @param {LikeState} state - 현재 좋아요 상태
 * @param {number} count - 구매할 좋아요 수
 * @returns {Partial<LikeState>} 업데이트된 상태
 * @description 프리미엄 좋아요를 구매하여 남은 좋아요 수 증가
 */
export const purchasePremiumLikesAction = (
  state: LikeState,
  count: number
): Partial<LikeState> => {
  return {
    premiumLikesRemaining: state.premiumLikesRemaining + count,
  };
};