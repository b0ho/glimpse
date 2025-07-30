import { likeApi } from '@/services/api/likeApi';
import { Like, Match } from '@/types';
import { LikeState } from './types';
import { canUserSendLike, getTodayDateString } from './utils';
import { LIKE_SYSTEM } from '@/utils/constants';

// Like sending actions
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
      isSuperLike,
      createdAt: new Date(),
    };

    const updatedState: Partial<LikeState> = {
      sentLikes: [...state.sentLikes, newLike],
    };

    // Update daily usage
    if (!state.hasPremium) {
      if (state.dailyLikesUsed < LIKE_SYSTEM.FREE_DAILY_LIKES) {
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
        createdAt: new Date(),
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

// Rewind action
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
    if (lastLike.isSuperLike) {
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

// Daily reset action
export const resetDailyLimitsAction = (
  state: LikeState
): Partial<LikeState> => {
  return {
    dailyLikesUsed: 0,
    superLikesUsed: 0,
    lastResetDate: getTodayDateString(),
  };
};

// Purchase premium likes action
export const purchasePremiumLikesAction = (
  state: LikeState,
  count: number
): Partial<LikeState> => {
  return {
    premiumLikesRemaining: state.premiumLikesRemaining + count,
  };
};