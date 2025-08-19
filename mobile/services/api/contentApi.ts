/**
 * 콘텐츠 API 서비스
 * @module api/contentApi
 * @description 피드 콘텐츠 관련 API 호출 함수들
 */

import apiClient from './config';
import { Content } from '../../shared/types';

/**
 * 콘텐츠 API 서비스
 * @namespace contentApi
 */
export const contentApi = {
  /**
   * 피드 콘텐츠 목록 조회
   * @async
   * @param {string} [groupId] - 그룹 ID (선택적)
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=20] - 페이지당 항목 수
   * @returns {Promise<Content[]>} 콘텐츠 목록
   */
  async getContents(groupId?: string, page: number = 1, limit: number = 20): Promise<Content[]> {
    
    const params: any = { page, limit };
    if (groupId) params.groupId = groupId;
    
    const response = await apiClient.get<{ success: boolean; data: Content[] }>('/contents', params);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('콘텐츠 목록 조회 실패');
  },

  /**
   * 콘텐츠 생성
   * @async
   * @param {Partial<Content>} content - 콘텐츠 데이터
   * @returns {Promise<Content>} 생성된 콘텐츠
   */
  async createContent(content: Partial<Content>): Promise<Content> {
    // 실제 API 호출 - 개발 환경에서도 실제 서버 사용
    console.log('[ContentAPI] 콘텐츠 생성 API 호출:', content);
    
    const response = await apiClient.post<{ success: boolean; data: Content }>('/contents', content);
    if (response.success && response.data) {
      console.log('[ContentAPI] 콘텐츠 생성 완료:', response.data);
      return response.data;
    }
    throw new Error('콘텐츠 생성 실패');
  },

  /**
   * 콘텐츠 좋아요
   * @async
   * @param {string} contentId - 콘텐츠 ID
   * @returns {Promise<void>}
   */
  async likeContent(contentId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean }>(`/contents/${contentId}/like`);
    if (!response.success) {
      throw new Error('좋아요 실패');
    }
  },

  /**
   * 콘텐츠 좋아요 취소
   * @async
   * @param {string} contentId - 콘텐츠 ID
   * @returns {Promise<void>}
   */
  async unlikeContent(contentId: string): Promise<void> {
    const response = await apiClient.delete<{ success: boolean }>(`/contents/${contentId}/like`);
    if (!response.success) {
      throw new Error('좋아요 취소 실패');
    }
  },

  /**
   * 콘텐츠 수정
   * @async
   * @param {string} contentId - 콘텐츠 ID
   * @param {Partial<Content>} content - 수정할 콘텐츠 데이터
   * @returns {Promise<Content>} 수정된 콘텐츠
   */
  async updateContent(contentId: string, content: Partial<Content>): Promise<Content> {
    const response = await apiClient.put<{ success: boolean; data: Content }>(`/contents/${contentId}`, content);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('콘텐츠 수정 실패');
  },

  /**
   * 콘텐츠 삭제
   * @async
   * @param {string} contentId - 콘텐츠 ID
   * @returns {Promise<void>}
   */
  async deleteContent(contentId: string): Promise<void> {
    const response = await apiClient.delete<{ success: boolean }>(`/contents/${contentId}`);
    if (!response.success) {
      throw new Error('콘텐츠 삭제 실패');
    }
  }
};