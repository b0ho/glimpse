import apiClient from './config';
import { User } from '../../shared/types';

/**
 * 인증 관련 API 서비스
 * @namespace authService
 * @description 사용자 프로필 업데이트 및 계정 관리 API
 */
export const authService = {
  /**
   * 프로필 업데이트
   * @async
   * @param {Object} data - 업데이트할 프로필 데이터
   * @param {string} [data.nickname] - 닉네임
   * @param {string} [data.bio] - 자기소개
   * @param {number} [data.age] - 나이
   * @returns {Promise<{success: boolean, data?: any, message?: string}>} 결과 객체
   */
  updateProfile: async (data: { nickname?: string; bio?: string; age?: number }) => {
    try {
      const response = await apiClient.put<{ data: any }>('/users/profile', data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '프로필 업데이트에 실패했습니다.',
      };
    }
  },
  
  /**
   * 계정 삭제
   * @async
   * @param {Object} data - 삭제 요청 데이터
   * @param {string} [data.reason] - 탈퇴 사유
   * @returns {Promise<{success: boolean, message: string}>} 결과 객체
   * @description 사용자 계정을 비활성화하고 데이터를 삭제
   */
  deleteAccount: async (data: { reason?: string }) => {
    try {
      const response = await apiClient.delete('/users/account');
      return {
        success: true,
        message: '계정이 비활성화되었습니다.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '계정 삭제에 실패했습니다.',
      };
    }
  },
};