/**
 * 매칭 API 서비스
 * @module api/matchApi
 * @description 매칭 관련 API 호출 함수들
 */

import apiClient from './config';
import { Match } from '../../shared/types';

/**
 * 매칭 API 서비스
 * @namespace matchApi
 */
export const matchApi = {
  /**
   * 매칭 목록 조회
   * @async
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=20] - 페이지당 항목 수
   * @returns {Promise<Match[]>} 매칭 목록
   */
  async getMatches(page: number = 1, limit: number = 20): Promise<Match[]> {

    const response = await apiClient.get<Match[]>('/matching/matches', {
      page,
      limit
    });
    
    // 서버에서 직접 배열을 반환하는 경우
    if (Array.isArray(response)) {
      return response;
    }
    
    // 서버에서 success 구조로 반환하는 경우
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data || [];
    }
    
    // 빈 배열 반환
    return [];
  },

  /**
   * 특정 매칭 조회
   * @async
   * @param {string} matchId - 매칭 ID
   * @returns {Promise<Match>} 매칭 정보
   */
  async getMatchById(matchId: string): Promise<Match> {
    const response = await apiClient.get<{ success: boolean; data: Match }>(`/matching/matches/${matchId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('매칭 조회 실패');
  },

  /**
   * 매칭 삭제 (언매칭)
   * @async
   * @param {string} matchId - 매칭 ID
   * @returns {Promise<void>}
   */
  async unmatch(matchId: string): Promise<void> {
    const response = await apiClient.delete<{ success: boolean }>(`/matching/matches/${matchId}`);
    if (!response.success) {
      throw new Error('언매칭 실패');
    }
  },

  /**
   * 추천 사용자 목록 조회
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=10] - 페이지당 항목 수
   * @returns {Promise<any[]>} 추천 사용자 목록
   */
  async getRecommendations(groupId: string, page: number = 1, limit: number = 10): Promise<any[]> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/matching/recommendations', {
      groupId,
      page,
      limit
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('추천 목록 조회 실패');
  },

  /**
   * 미스매치 신고
   * @async
   * @param {string} matchId - 매칭 ID
   * @param {string} [reason] - 신고 사유
   * @returns {Promise<void>}
   * @description 잘못된 매칭을 신고하고 다시 대기 상태로 전환
   */
  async reportMismatch(matchId: string, reason?: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/matching/matches/${matchId}/mismatch`,
      { reason }
    );
    if (!response.success) {
      throw new Error(response.message || '미스매치 신고 실패');
    }
  }
};