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
}