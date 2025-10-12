import apiClient from './config';
import { ApiResponse } from '@/types';

/**
 * 계정 삭제 관련 API 서비스
 * @namespace accountDeletionService
 * @description 7일 대기 시스템을 통한 안전한 계정 삭제 API
 */
export const accountDeletionService = {
  /**
   * 계정 삭제 요청 (7일 대기)
   * @async
   * @param {Object} data - 삭제 요청 데이터
   * @param {string} [data.reason] - 탈퇴 사유
   * @returns {Promise<{success: boolean, message?: string, scheduledDeletionAt?: string, daysRemaining?: number}>} 결과 객체
   * @description 7일 대기 후 계정 삭제 요청
   */
  requestDeletion: async (data: { reason?: string }) => {
    try {
      const response = await apiClient.delete<ApiResponse<any>>('/users/account', { data });
      console.log('[AccountDeletionService] API Response:', response.data);

      return {
        success: true,
        message: '계정 삭제가 요청되었습니다. 7일 후 완전히 삭제됩니다.',
        scheduledDeletionAt: response.data?.data?.scheduledDeletionAt,
        daysRemaining: response.data?.data?.daysRemaining || 7,
      };
    } catch (error: any) {
      console.error('[AccountDeletionService] API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || '계정 삭제 요청에 실패했습니다.',
      };
    }
  },

  /**
   * 계정 복구
   * @async
   * @returns {Promise<{success: boolean, message: string}>} 결과 객체
   * @description 삭제 대기 중인 계정을 복구
   */
  restoreAccount: async () => {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/users/account/restore');
      return {
        success: true,
        message: '계정이 성공적으로 복구되었습니다.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '계정 복구에 실패했습니다.',
      };
    }
  },

  /**
   * 계정 삭제 상태 조회
   * @async
   * @returns {Promise<{success: boolean, data?: AccountDeletionInfo, message?: string}>} 결과 객체
   * @description 현재 계정의 삭제 상태 정보 조회
   */
  getDeletionStatus: async () => {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/users/account/deletion-status');
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '삭제 상태 조회에 실패했습니다.',
      };
    }
  },

  /**
   * 계정이 삭제 대기 중인지 확인
   * @async
   * @returns {Promise<{success: boolean, isPendingDeletion?: boolean, message?: string}>} 결과 객체
   */
  isPendingDeletion: async () => {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/users/account/pending-deletion');
      return {
        success: true,
        isPendingDeletion: response.data?.data?.isPendingDeletion || false,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '삭제 상태 확인에 실패했습니다.',
      };
    }
  },
};

/**
 * 계정 삭제 상태 정보 인터페이스
 */
export interface AccountDeletionInfo {
  status: 'ACTIVE' | 'DELETION_REQUESTED' | 'PERMANENTLY_DELETED';
  requestedAt?: Date;
  scheduledDeletionAt?: Date;
  daysRemaining?: number;
  reason?: string;
}