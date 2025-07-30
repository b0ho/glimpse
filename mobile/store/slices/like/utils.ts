import { LIKE_SYSTEM } from '@/utils/constants';
import { Like, Match, AnonymousUserInfo } from '@/types';
import { LocationMatchScore } from './types';

// Date utilities
export const isToday = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Like validation utilities
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
  if (dailyLikesUsed >= LIKE_SYSTEM.FREE_DAILY_LIKES) {
    // Check if they have purchased premium likes
    return premiumLikesRemaining > 0;
  }

  return true;
};

export const getRemainingLikes = (
  dailyLikesUsed: number,
  hasPremium: boolean,
  premiumLikesRemaining: number
): number => {
  if (hasPremium) return -1; // Unlimited
  
  const remainingDaily = Math.max(0, LIKE_SYSTEM.FREE_DAILY_LIKES - dailyLikesUsed);
  return remainingDaily + premiumLikesRemaining;
};

// Anonymity utilities
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
      isAnonymous: true,
      displayName: '익명의 사용자',
      canViewProfile: false,
      canChat: false,
    };
  }

  // If matched, return actual user info
  return {
    isAnonymous: false,
    displayName: userId, // Will be replaced with actual nickname
    canViewProfile: true,
    canChat: true,
    matchedAt: match.createdAt,
  };
};

// Location matching utilities
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
export const canSendSuperLike = (
  hasPremium: boolean,
  superLikesUsed: number,
  dailySuperLikesLimit: number
): boolean => {
  if (!hasPremium) return false;
  return superLikesUsed < dailySuperLikesLimit;
};

export const getRemainingSuperLikes = (
  hasPremium: boolean,
  superLikesUsed: number,
  dailySuperLikesLimit: number
): number => {
  if (!hasPremium) return 0;
  return Math.max(0, dailySuperLikesLimit - superLikesUsed);
};

// Rewind utilities
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