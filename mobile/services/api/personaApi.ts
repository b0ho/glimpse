import { apiClient } from './config';
import { PersonaSettings } from '@/types';

export const personaApi = {
  // 내 페르소나 가져오기
  getMyPersona: async (): Promise<PersonaSettings | null> => {
    try {
      const response = await apiClient.get('/persona/my');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // 페르소나가 없는 경우
      }
      throw error;
    }
  },

  // 페르소나 생성 또는 업데이트
  createOrUpdatePersona: async (data: Partial<PersonaSettings>): Promise<PersonaSettings> => {
    const response = await apiClient.post('/persona', data);
    return response.data;
  },

  // 위치 업데이트
  updateLocation: async (latitude: number, longitude: number): Promise<void> => {
    await apiClient.patch('/persona/location', { latitude, longitude });
  },

  // 근처 페르소나 검색
  getNearbyPersonas: async (
    latitude: number, 
    longitude: number, 
    radiusKm: number = 5
  ): Promise<PersonaSettings[]> => {
    const response = await apiClient.get('/persona/nearby', {
      params: { latitude, longitude, radiusKm }
    });
    return response.data;
  },

  // 페르소나 삭제
  deletePersona: async (): Promise<void> => {
    await apiClient.delete('/persona/my');
  },
};