/**
 * 좋아요 기능 유틸리티
 * @module like/utils
 * @description 좋아요 기능에서 사용하는 유틸리티 함수
 */

import { LIKE_SYSTEM } from '@/utils/constants';
import { Like, Match, AnonymousUserInfo } from '@/types';
import { LocationMatchScore } from './types';

// Date utilities
/**
 * 오늘 날짜인지 확인
 * @function isToday
 * @param {string} dateString - 확인할 날짜 문자열
 * @returns {boolean} 오늘 여부
 */
export const isToday = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * 오늘 날짜 문자열 반환
 * @function getTodayDateString
 * @returns {string} YYYY-MM-DD 형식의 오늘 날짜
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Like validation utilities
/**
 * 좋아요 전송 가능 여부 확인
 * @function canUserSendLike
 * @param {string} toUserId - 대상 사용자 ID
 * @param {Like[]} sentLikes - 보낸 좋아요 목록
 * @param {number} dailyLikesUsed - 오늘 사용한 좋아요 수
 * @param {boolean} hasPremium - 프리미엄 여부
 * @param {number} premiumLikesRemaining - 남은 프리미엄 좋아요 수
 * @returns {boolean} 전송 가능 여부
 */
export const canUserSendLike = (
  toUserId: string,
  sentLikes: Like[],
  dailyLikesUsed: number,
  hasPremium: boolean,
  premiumLikesRemaining: number
): boolean => {
  // Check if already liked
  const alreadyLiked = sentLikes.some(like => like.toUserId === toUserId);
  if (alreadyLiked) return false;

  // Premium users have unlimited likes
  if (hasPremium) return true;

  // Check daily limit for free users
  if (dailyLikesUsed >= LIKE_SYSTEM.DAILY_FREE_LIKES) {
    // Check if they have purchased premium likes
    return premiumLikesRemaining > 0;
  }

  return true;
};

/**
 * 남은 좋아요 수 계산
 * @function getRemainingLikes
 * @param {number} dailyLikesUsed - 오늘 사용한 좋아요 수
 * @param {boolean} hasPremium - 프리미엄 여부
 * @param {number} premiumLikesRemaining - 남은 프리미엄 좋아요 수
 * @returns {number} 남은 좋아요 수 (-1은 무제한)
 */
export const getRemainingLikes = (
  dailyLikesUsed: number,
  hasPremium: boolean,
  premiumLikesRemaining: number
): number => {
  if (hasPremium) return -1; // Unlimited
  
  const remainingDaily = Math.max(0, LIKE_SYSTEM.DAILY_FREE_LIKES - dailyLikesUsed);
  return remainingDaily + premiumLikesRemaining;
};

// Anonymity utilities
/**
 * 익명 사용자 정보 가져오기
 * @function getAnonymousInfo
 * @param {string} userId - 대상 사용자 ID
 * @param {string} currentUserId - 현재 사용자 ID
 * @param {Match[]} matches - 매칭 목록
 * @returns {AnonymousUserInfo | null} 익명 사용자 정보
 * @description 매칭 여부에 따라 익명성 수준 결정
 */
export const getAnonymousInfo = (
  userId: string,
  currentUserId: string,
  matches: Match[]
): AnonymousUserInfo | null => {
  // Check if matched
  const match = matches.find(m => 
    (m.user1Id === currentUserId && m.user2Id === userId) ||
    (m.user1Id === userId && m.user2Id === currentUserId)
  );

  if (!match) {
    return {
      id: userId,
      anonymousId: 'ANON_' + userId,
      displayName: '익명의 사용자',
      nickname: '익명의 사용자',
      isMatched: false
    };
  }

  // If matched, return actual user info
  return {
    id: userId,
    anonymousId: 'ANON_' + userId,
    displayName: userId, // Will be replaced with actual nickname
    nickname: userId, // Will be replaced with actual nickname
    isMatched: true
  };
};

// Location matching utilities
/**
 * 두 지점 간 거리 계산
 * @function calculateDistance
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lon1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lon2 - 두 번째 지점의 경도
 * @returns {number} 거리 (km)
 * @description Haversine 공식을 사용한 직선 거리 계산
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

/**
 * 위치 기반 매칭 점수 계산
 * @function calculateLocationScore
 * @param {number} distance - 거리 (km)
 * @param {number} commonGroups - 공통 그룹 수
 * @param {Date} lastActive - 마지막 활동 시간
 * @returns {number} 매칭 점수 (0-100)
 * @description 거리, 공통 그룹, 활동도를 기반으로 점수 계산
 */
export const calculateLocationScore = (
  distance: number,
  commonGroups: number,
  lastActive: Date
): number => {
  // Distance score (0-40 points)
  let distanceScore = 0;
  if (distance < 0.5) distanceScore = 40;
  else if (distance < 1) distanceScore = 35;
  else if (distance < 2) distanceScore = 30;
  else if (distance < 5) distanceScore = 20;
  else if (distance < 10) distanceScore = 10;
  else distanceScore = 0;

  // Common groups score (0-30 points)
  const groupScore = Math.min(30, commonGroups * 10);

  // Activity score (0-30 points)
  const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  let activityScore = 30;
  if (daysSinceActive > 0) activityScore = Math.max(0, 30 - daysSinceActive * 2);

  return distanceScore + groupScore + activityScore;
};

// Super Like utilities
/**
 * 슈퍼 좋아요 전송 가능 여부
 * @function canSendSuperLike
 * @param {boolean} hasPremium - 프리미엄 여부
 * @param {number} superLikesUsed - 사용한 슈퍼 좋아요 수
 * @param {number} dailySuperLikesLimit - 일일 슈퍼 좋아요 제한
 * @returns {boolean} 전송 가능 여부
 */
export const canSendSuperLike = (
  hasPremium: boolean,
  superLikesUsed: number,
  dailySuperLikesLimit: number
): boolean => {
  if (!hasPremium) return false;
  return superLikesUsed < dailySuperLikesLimit;
};

/**
 * 남은 슈퍼 좋아요 수 계산
 * @function getRemainingSuperLikes
 * @param {boolean} hasPremium - 프리미엄 여부
 * @param {number} superLikesUsed - 사용한 슈퍼 좋아요 수
 * @param {number} dailySuperLikesLimit - 일일 슈퍼 좋아요 제한
 * @returns {number} 남은 슈퍼 좋아요 수
 */
export const getRemainingSuperLikes = (
  hasPremium: boolean,
  superLikesUsed: number,
  dailySuperLikesLimit: number
): number => {
  if (!hasPremium) return 0;
  return Math.max(0, dailySuperLikesLimit - superLikesUsed);
};

// Rewind utilities
/**
 * 좋아요 되돌리기 가능 여부
 * @function canRewind
 * @param {boolean} hasPremium - 프리미엄 여부
 * @param {Like[]} sentLikes - 보낸 좋아요 목록
 * @returns {boolean} 되돌리기 가능 여부
 * @description 5분 이내의 좋아요만 되돌릴 수 있음
 */
export const canRewind = (
  hasPremium: boolean,
  sentLikes: Like[]
): boolean => {
  if (!hasPremium) return false;
  if (sentLikes.length === 0) return false;
  
  const lastLike = sentLikes[sentLikes.length - 1];
  const timeSinceLike = Date.now() - new Date(lastLike.createdAt).getTime();
  
  // Can only rewind within 5 minutes
  return timeSinceLike < 5 * 60 * 1000;
};