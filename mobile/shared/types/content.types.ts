/**
 * 컨텐츠 관련 타입 정의
 */

import { User } from './user.types';

/**
 * 스토리
 */
export interface Story {
  id: string;
  userId: string;
  user?: User;
  imageUrl: string;
  videoUrl?: string;
  caption?: string;
  viewCount: number;
  viewers?: string[];
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 컨텐츠
 */
export interface Content {
  id: string;
  userId: string;
  user?: User;
  type: 'STORY' | 'POST' | 'VIDEO';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  likes: number;
  views: number;
  comments: number;
  isPublic: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;

  // 추가 속성들 (컴포넌트 호환성)
  authorId?: string;           // userId의 별칭
  authorNickname?: string;     // 작성자 닉네임
  isLikedByUser?: boolean;     // 현재 사용자가 좋아요 했는지
  text?: string;               // caption의 별칭
  imageUrls?: string[];        // 이미지 URL 배열
  likeCount?: number;          // likes의 별칭
  commentCount?: number;       // comments의 별칭
  groupId?: string;            // 그룹 ID
}