/**
 * 커뮤니티 관련 타입 정의
 */

import { User } from './user.types';
import { Group } from './group.types';

/**
 * 커뮤니티 게시글
 */
export interface CommunityPost {
  id: string;
  authorId: string;
  groupId: string;
  title: string;
  content: string;
  imageUrls?: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned?: boolean;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  author?: User;
  group?: Group;
  comments?: Comment[];
  likes?: PostLike[];
}

/**
 * 댓글
 */
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string; // For nested comments
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  author?: User;
  post?: CommunityPost;
  parent?: Comment;
  replies?: Comment[];
}

/**
 * 게시글 좋아요
 */
export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}