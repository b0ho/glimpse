/**
 * 콘텐츠 API 서비스
 * @module api/contentApi
 * @description 피드 콘텐츠 관련 API 호출 함수들
 */

import apiClient from './config';
import { Content } from '../../shared/types';
import { getAllContents, saveCreatedContent, getCreatedContents } from '@/utils/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // 개발 환경에서는 mock 데이터와 저장된 콘텐츠를 함께 반환
    if (__DEV__) {
      console.log('[ContentAPI] Mock 콘텐츠 목록 조회 시작');
      try {
        const allContents = await getAllContents();
        console.log('[ContentAPI] Mock 콘텐츠 목록 반환:', allContents.length, '개');
        
        // groupId 필터링 (선택적)
        if (groupId) {
          const filteredContents = allContents.filter(content => content.groupId === groupId);
          console.log('[ContentAPI] 그룹 필터링 결과:', filteredContents.length, '개');
          return filteredContents;
        }
        
        return allContents;
      } catch (error) {
        console.error('[ContentAPI] Mock 콘텐츠 목록 조회 실패:', error);
        return [];
      }
    }
    
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
    // 로컬 개발 환경에서만 mock 데이터 사용 (Vercel 배포에서는 실제 API 사용)
    if (__DEV__ && (typeof window === 'undefined' || window.location?.hostname === 'localhost')) {
      console.log('[ContentAPI] Mock 콘텐츠 생성:', content);
      console.log('[ContentAPI] 전달받은 authorNickname:', content.authorNickname);
      
      // 실제 API 호출 시뮬레이션을 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockContent: Content = {
        id: `mock_content_${Date.now()}`,
        userId: content.userId || 'current_user',
        authorId: content.authorId || 'current_user',
        authorNickname: content.authorNickname || '테스트유저', // 기본값을 테스트유저로 통일
        type: content.type || 'text',
        text: content.text || '',
        imageUrls: content.imageUrls || [],
        groupId: content.groupId,
        likes: 0,
        likeCount: 0,
        views: 0,
        isPublic: true,
        isLikedByUser: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('[ContentAPI] Mock 콘텐츠 생성 완료:', mockContent);
      
      // AsyncStorage에 저장
      await saveCreatedContent(mockContent);
      
      return mockContent;
    }
    
    const response = await apiClient.post<{ success: boolean; data: Content }>('/contents', content);
    if (response.success && response.data) {
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
    // 로컬 개발 환경에서만 mock 데이터 사용 (Vercel 배포에서는 실제 API 사용)
    if (__DEV__ && (typeof window === 'undefined' || window.location?.hostname === 'localhost')) {
      console.log('[ContentAPI] Mock 콘텐츠 수정:', { contentId, content });
      
      // AsyncStorage에서 기존 콘텐츠 찾아서 업데이트
      const existingContents = await getCreatedContents();
      const contentIndex = existingContents.findIndex(c => c.id === contentId);
      
      if (contentIndex === -1) {
        throw new Error('수정할 콘텐츠를 찾을 수 없습니다.');
      }
      
      const updatedContent: Content = {
        ...existingContents[contentIndex],
        ...content,
        updatedAt: new Date(),
      };
      
      // AsyncStorage 업데이트
      const updatedContents = [...existingContents];
      updatedContents[contentIndex] = updatedContent;
      await AsyncStorage.setItem('user_created_contents', JSON.stringify(updatedContents));
      
      console.log('[ContentAPI] Mock 콘텐츠 수정 완료:', updatedContent);
      return updatedContent;
    }
    
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
    // 로컬 개발 환경에서만 mock 데이터 사용 (Vercel 배포에서는 실제 API 사용)
    if (__DEV__ && (typeof window === 'undefined' || window.location?.hostname === 'localhost')) {
      console.log('[ContentAPI] Mock 콘텐츠 삭제:', contentId);
      
      const existingContents = await getCreatedContents();
      const filteredContents = existingContents.filter(c => c.id !== contentId);
      await AsyncStorage.setItem('user_created_contents', JSON.stringify(filteredContents));
      
      console.log('[ContentAPI] Mock 콘텐츠 삭제 완료');
      return;
    }
    
    const response = await apiClient.delete<{ success: boolean }>(`/contents/${contentId}`);
    if (!response.success) {
      throw new Error('콘텐츠 삭제 실패');
    }
  }
};