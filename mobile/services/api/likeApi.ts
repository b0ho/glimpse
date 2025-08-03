/**
 * 좋아요 API 서비스
 * @module api/likeApi
 * @description 좋아요 관련 API 호출 함수들
 */

import apiClient from './config';
import { Like, Match } from '@shared/types';

/**
 * 좋아요 API 인터페이스
 * @interface LikeApiResponse
 */
interface LikeApiResponse {
  likeId: string;
  isMatch: boolean;
  matchId?: string;
}

/**
 * 좋아요 API 서비스
 * @namespace likeApi
 */
export const likeApi = {
  /**
   * 좋아요 전송
   * @async
   * @param {string} toUserId - 받는 사용자 ID
   * @param {string} groupId - 그룹 ID
   * @param {boolean} isSuper - 슈퍼 좋아요 여부
   * @returns {Promise<LikeApiResponse>} 좋아요 결과
   */
  async sendLike(toUserId: string, groupId: string, isSuper: boolean = false): Promise<LikeApiResponse> {
    const response = await apiClient.post<{ data: LikeApiResponse }>('/likes', {
      toUserId,
      groupId,
      isSuper
    });
    return response.data;
  },

  /**
   * 좋아요 취소
   * @async
   * @param {string} toUserId - 대상 사용자 ID
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<void>}
   */
  async unlikeUser(toUserId: string, groupId: string): Promise<void> {
    await apiClient.delete(`/likes/${toUserId}`);
  },

  /**
   * 받은 좋아요 목록 조회
   * @async
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=20] - 페이지당 항목 수
   * @returns {Promise<Like[]>} 좋아요 목록
   */
  async getReceivedLikes(page: number = 1, limit: number = 20): Promise<Like[]> {
    const response = await apiClient.get<{ data: Like[] }>('/likes/received', {
      page,
      limit
    });
    return response.data;
  },

  /**
   * 보낸 좋아요 목록 조회
   * @async
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=20] - 페이지당 항목 수
   * @returns {Promise<Like[]>} 좋아요 목록
   */
  async getSentLikes(page: number = 1, limit: number = 20): Promise<Like[]> {
    const response = await apiClient.get<{ data: Like[] }>('/likes/sent', {
      page,
      limit
    });
    return response.data;
  },

  /**
   * 일일 좋아요 상태 조회
   * @async
   * @returns {Promise<{ dailyUsed: number; dailyLimit: number; premiumLikes: number }>} 좋아요 상태
   */
  async getLikeStatus(): Promise<{ dailyUsed: number; dailyLimit: number; premiumLikes: number }> {
    const response = await apiClient.get<{ data: { dailyUsed: number; dailyLimit: number; premiumLikes: number } }>('/likes/status');
    return response.data;
  },

  /**
   * 좋아요 기록 확인
   * @async
   * @param {string} userId - 대상 사용자 ID
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<{ canLike: boolean; cooldownDays?: number }>} 좋아요 가능 여부
   */
  async checkLikeHistory(userId: string, groupId: string): Promise<{ canLike: boolean; cooldownDays?: number }> {
    const response = await apiClient.get<{ data: { canLike: boolean; cooldownDays?: number } }>(`/likes/check/${userId}`, {
      groupId
    });
    return response.data;
  }
};