/**
 * 익명성 관리 유틸리티
 * 매칭 상태에 따라 사용자 정보를 필터링하고 표시 이름을 결정
 */

import { User, AnonymousUserInfo, Match } from '@/types';

/**
 * 매칭 상태에 따라 사용자 정보를 익명화 처리
 * @param user - 원본 사용자 정보
 * @param currentUserId - 현재 사용자 ID
 * @param matches - 현재 사용자의 매칭 목록
 * @returns 익명화 처리된 사용자 정보
 */
export const getAnonymousUserInfo = (
  user: User,
  currentUserId: string,
  matches: Match[]
): AnonymousUserInfo => {
  // 본인인 경우 모든 정보 공개
  if (user.id === currentUserId) {
    return {
      id: user.id,
      anonymousId: user.anonymousId,
      displayName: user.realName || user.nickname,
      nickname: user.nickname,
      realName: user.realName,
      isMatched: true,
      gender: user.gender,
    };
  }

  // 매칭 여부 확인
  const isMatched = matches.some(match => 
    (match.user1Id === currentUserId && match.user2Id === user.id) ||
    (match.user2Id === currentUserId && match.user1Id === user.id)
  );

  // 매칭된 경우 실명 공개, 아닌 경우 닉네임만 공개
  return {
    id: user.id,
    anonymousId: user.anonymousId,
    displayName: isMatched ? (user.realName || user.nickname) : user.nickname,
    nickname: user.nickname,
    realName: isMatched ? user.realName : undefined,
    isMatched,
    gender: user.gender,
  };
};

/**
 * 매칭 상태 확인
 * @param userId - 확인할 사용자 ID
 * @param currentUserId - 현재 사용자 ID  
 * @param matches - 매칭 목록
 */
export const isUserMatched = (
  userId: string,
  currentUserId: string,
  matches: Match[]
): boolean => {
  return matches.some(match => 
    (match.user1Id === currentUserId && match.user2Id === userId) ||
    (match.user2Id === currentUserId && match.user1Id === userId)
  );
};

/**
 * 사용자 표시 이름 결정
 * @param user - 사용자 정보
 * @param isMatched - 매칭 여부
 */
export const getUserDisplayName = (user: User, isMatched: boolean): string => {
  if (isMatched && user.realName) {
    return user.realName;
  }
  return user.nickname;
};

/**
 * 익명성 정책 적용
 * 매칭되지 않은 사용자의 민감한 정보를 숨김
 */
export const applyAnonymityPolicy = (
  user: User,
  isMatched: boolean
): Partial<User> => {
  const anonymizedUser: Partial<User> = {
    id: user.id,
    anonymousId: user.anonymousId,
    nickname: user.nickname,
    gender: user.gender,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };

  // 매칭된 경우에만 실명과 전화번호 공개
  if (isMatched) {
    anonymizedUser.realName = user.realName;
    anonymizedUser.phoneNumber = user.phoneNumber;
  }

  return anonymizedUser;
};