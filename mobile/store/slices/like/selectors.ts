/**
 * 좋아요 기능 선택자
 * @module like/selectors
 * @description 좋아요 상태에서 특정 데이터를 선택하는 함수
 */

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
/**
 * 특정 사용자에게 좋아요 했는지 확인
 * @function hasLikedUserSelector
 * @param {LikeState} state - 좋아요 상태
 * @param {string} userId - 확인할 사용자 ID
 * @returns {boolean} 좋아요 여부
 */
export const hasLikedUserSelector = (
  state: LikeState,
  userId: string
): boolean => {
  return state.sentLikes.some(like => like.toUserId === userId);
};

/**
 * 특정 사용자에게 슈퍼 좋아요 했는지 확인
 * @function isSuperLikedUserSelector
 * @param {LikeState} state - 좋아요 상태
 * @param {string} userId - 확인할 사용자 ID
 * @returns {boolean} 슈퍼 좋아요 여부
 */
export const isSuperLikedUserSelector = (
  state: LikeState,
  userId: string
): boolean => {
  return state.sentLikes.some(
    like => like.toUserId === userId && like.isSuper
  );
};

/**
 * 특정 사용자와 매칭되었는지 확인
 * @function isMatchedWithSelector
 * @param {LikeState} state - 좋아요 상태
 * @param {string} userId - 확인할 사용자 ID
 * @param {string} currentUserId - 현재 사용자 ID
 * @returns {boolean} 매칭 여부
 */
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

/**
 * 받은 좋아요 수 가져오기
 * @function getReceivedLikesCountSelector
 * @param {LikeState} state - 좋아요 상태
 * @returns {number} 확인하지 않은 받은 좋아요 수
 */
export const getReceivedLikesCountSelector = (
  state: LikeState
): number => {
  // TODO: Add isViewed property to Like interface or use a different approach
  return state.receivedLikes.length;
};

/**
 * 남은 무료 좋아요 수 가져오기
 * @function getRemainingFreeLikesSelector
 * @param {LikeState} state - 좋아요 상태
 * @returns {number} 남은 무료 좋아요 수
 */
export const getRemainingFreeLikesSelector = (
  state: LikeState
): number => {
  return getRemainingLikes(
    state.dailyLikesUsed,
    state.hasPremium,
    state.premiumLikesRemaining
  );
};

/**
 * 남은 슈퍼 좋아요 수 가져오기
 * @function getRemainingSuperLikesSelector
 * @param {LikeState} state - 좋아요 상태
 * @returns {number} 남은 슈퍼 좋아요 수
 */
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
/**
 * 익명 사용자 정보 가져오기
 * @function getAnonymousUserInfoSelector
 * @param {LikeState} state - 좋아요 상태
 * @param {string} userId - 대상 사용자 ID
 * @param {string} currentUserId - 현재 사용자 ID
 * @returns {AnonymousUserInfo | null} 익명 사용자 정보
 */
export const getAnonymousUserInfoSelector = (
  state: LikeState,
  userId: string,
  currentUserId: string
) => {
  return getAnonymousInfo(userId, currentUserId, state.matches);
};

/**
 * 사용자 표시 이름 가져오기
 * @function getUserDisplayNameSelector
 * @param {LikeState} state - 좋아요 상태
 * @param {string} userId - 대상 사용자 ID
 * @param {string} currentUserId - 현재 사용자 ID
 * @returns {string} 표시할 사용자 이름
 */
export const getUserDisplayNameSelector = (
  state: LikeState,
  userId: string,
  currentUserId: string
): string => {
  const anonymousInfo = getAnonymousInfo(userId, currentUserId, state.matches);
  return anonymousInfo?.displayName || '익명의 사용자';
};

// Location-based selectors
/**
 * 위치 기반 매칭 목록 가져오기
 * @function getLocationBasedMatchesSelector
 * @param {LikeState} state - 좋아요 상태
 * @param {Object} [userLocation] - 사용자 위치 정보
 * @param {Array} [users] - 대상 사용자 목록
 * @returns {LocationMatchScore[]} 위치 기반 매칭 점수 목록
 */
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

/**
 * 위치 기반 매칭 점수 계산
 * @function calculateLocationMatchingScoreSelector
 * @param {string} userId - 대상 사용자 ID
 * @param {Object} [userLocation] - 현재 사용자 위치
 * @param {Object} [targetUser] - 대상 사용자 정보
 * @returns {number} 매칭 점수
 */
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
/**
 * 마지막 좋아요 가져오기
 * @function getLastLikeSelector
 * @param {LikeState} state - 좋아요 상태
 * @returns {Like | null} 마지막으로 보낸 좋아요 또는 null
 * @description 되돌리기 기능을 위한 마지막 좋아요 조회
 */
export const getLastLikeSelector = (
  state: LikeState
): Like | null => {
  if (state.sentLikes.length === 0) return null;
  return state.sentLikes[state.sentLikes.length - 1];
};