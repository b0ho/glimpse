import { apiClient } from './apiClient';
import { User } from '@shared/types';

export const authService = {
  updateProfile: async (data: { nickname?: string; bio?: string; age?: number }) => {
    try {
      const response = await apiClient.put('/users/profile', data);
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
  
  deleteAccount: async (data: { reason?: string }) => {
    try {
      const response = await apiClient.delete('/users/account', { data });
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