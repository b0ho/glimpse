/**
 * 매칭 성공 스토리 관련 타입 정의
 */

export interface SuccessStory {
  id: string;
  matchId: string;
  userId: string;
  partnerId: string;
  userNickname: string;
  partnerNickname: string;
  story: string;
  tags?: string[]; // 예: ['첫눈에 반함', '운명적 만남', '취미 공유']
  celebrationCount: number;
  createdAt: string;
  updatedAt: string;
  isAnonymous?: boolean; // 익명으로 작성 여부
  matchType?: string; // 어떤 방식으로 매칭됐는지 (그룹, 관심상대 찾기 등)
}

export interface CreateSuccessStoryInput {
  matchId: string;
  story: string;
  tags?: string[];
  isAnonymous?: boolean;
}

export interface Celebration {
  id: string;
  storyId: string;
  userId: string;
  userNickname: string;
  message?: string;
  emoji?: string; // 축하 이모지
  createdAt: string;
}