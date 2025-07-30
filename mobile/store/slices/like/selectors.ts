import { Like, Match } from '@/types';
import { LikeState, LocationMatchScore } from './types';
import {
  getRemainingLikes,
  getAnonymousInfo,
  calculateDistance,
  calculateLocationScore,
  getRemainingSuperLikes,
} from './utils';

// Basic selectors
export const hasLikedUserSelector = (
  state: LikeState,
  userId: string
): boolean => {
  return state.sentLikes.some(like => like.toUserId === userId);
};

export const isSuperLikedUserSelector = (
  state: LikeState,
  userId: string
): boolean => {
  return state.sentLikes.some(
    like => like.toUserId === userId && like.isSuperLike
  );
};

export const isMatchedWithSelector = (
  state: LikeState,
  userId: string,
  currentUserId: string
): boolean => {
  return state.matches.some(match => 
    (match.user1Id === currentUserId && match.user2Id === userId) ||
    (match.user1Id === userId && match.user2Id === currentUserId)
  );
};

export const getReceivedLikesCountSelector = (
  state: LikeState
): number => {
  return state.receivedLikes.filter(like => !like.isViewed).length;
};

export const getRemainingFreeLikesSelector = (
  state: LikeState
): number => {
  return getRemainingLikes(
    state.dailyLikesUsed,
    state.hasPremium,
    state.premiumLikesRemaining
  );
};

export const getRemainingSuperLikesSelector = (
  state: LikeState
): number => {
  return getRemainingSuperLikes(
    state.hasPremium,
    state.superLikesUsed,
    state.dailySuperLikesLimit
  );
};

// Complex selectors
export const getAnonymousUserInfoSelector = (
  state: LikeState,
  userId: string,
  currentUserId: string
) => {
  return getAnonymousInfo(userId, currentUserId, state.matches);
};

export const getUserDisplayNameSelector = (
  state: LikeState,
  userId: string,
  currentUserId: string
): string => {
  const anonymousInfo = getAnonymousInfo(userId, currentUserId, state.matches);
  return anonymousInfo?.displayName || '익명의 사용자';
};

// Location-based selectors
export const getLocationBasedMatchesSelector = (
  state: LikeState,
  userLocation?: { latitude: number; longitude: number },
  users?: Array<{
    id: string;
    nickname: string;
    location?: { latitude: number; longitude: number };
    lastActive: Date;
    commonGroups?: string[];
  }>
): LocationMatchScore[] => {
  if (!userLocation || !users) return [];

  const matchScores: LocationMatchScore[] = users
    .filter(user => user.location)
    .map(user => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        user.location!.latitude,
        user.location!.longitude
      );

      const commonGroups = user.commonGroups?.length || 0;
      const locationScore = calculateLocationScore(
        distance,
        commonGroups,
        user.lastActive
      );

      return {
        id: user.id,
        nickname: user.nickname,
        distance,
        commonGroups,
        matchingScore: locationScore,
        lastActive: user.lastActive,
        locationScore,
      };
    })
    .sort((a, b) => b.matchingScore - a.matchingScore);

  return matchScores;
};

export const calculateLocationMatchingScoreSelector = (
  userId: string,
  userLocation?: { latitude: number; longitude: number },
  targetUser?: {
    location?: { latitude: number; longitude: number };
    lastActive: Date;
    commonGroups?: string[];
  }
): number => {
  if (!userLocation || !targetUser?.location) return 0;

  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    targetUser.location.latitude,
    targetUser.location.longitude
  );

  const commonGroups = targetUser.commonGroups?.length || 0;
  return calculateLocationScore(
    distance,
    commonGroups,
    targetUser.lastActive
  );
};

// Last like selector for rewind feature
export const getLastLikeSelector = (
  state: LikeState
): Like | null => {
  if (state.sentLikes.length === 0) return null;
  return state.sentLikes[state.sentLikes.length - 1];
};