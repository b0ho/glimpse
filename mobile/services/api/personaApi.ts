/**
 * 페르소나 API 서비스
 * @module api/personaApi
 * @description 관심사 기반 익명 매칭을 위한 페르소나 관리 API
 */

import { apiClient } from './config';

// Persona 타입을 personaSlice에서 가져와서 PersonaSettings로 사용
interface PersonaSettings {
  id?: string;
  userId?: string;
  nickname: string;
  age?: number;
  bio?: string;
  interests?: string[];
  occupation?: string;
  height?: number;
  mbti?: string;
  drinking?: string;
  smoking?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 페르소나 API 서비스
 * @namespace personaApi
 * @description 사용자의 관심사와 선호도를 관리하는 페르소나 시스템
 */
export const personaApi = {
  /**
   * 내 페르소나 가져오기
   * @async
   * @returns {Promise<PersonaSettings | null>} 페르소나 설정 또는 null (없는 경우)
   * @description 현재 로그인한 사용자의 페르소나 정보 조회
   *
   * @example
   * const persona = await personaApi.getMyPersona();
   * if (persona) {
   *   console.log('관심사:', persona.interests);
   * }
   */
  getMyPersona: async (): Promise<PersonaSettings | null> => {
    try {
      const response: any = await apiClient.get('/persona/my');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // 페르소나가 없는 경우
      }
      throw error;
    }
  },

  /**
   * 페르소나 생성 또는 업데이트
   * @async
   * @param {Partial<PersonaSettings>} data - 페르소나 데이터
   * @returns {Promise<PersonaSettings>} 생성 또는 업데이트된 페르소나
   * @description 새로운 페르소나를 생성하거나 기존 페르소나를 업데이트
   *
   * @example
   * const persona = await personaApi.createOrUpdatePersona({
   *   interests: ['음악', '여행', '운동'],
   *   ageRange: [25, 35]
   * });
   */
  createOrUpdatePersona: async (data: Partial<PersonaSettings>): Promise<PersonaSettings> => {
    const response: any = await apiClient.post('/persona', data);
    return response.data;
  },

  /**
   * 위치 업데이트
   * @async
   * @param {number} latitude - 위도
   * @param {number} longitude - 경도
   * @returns {Promise<void>}
   * @description 페르소나의 현재 위치 정보 업데이트 (위치 기반 매칭)
   *
   * @example
   * await personaApi.updateLocation(37.5665, 126.9780);
   */
  updateLocation: async (latitude: number, longitude: number): Promise<void> => {
    await apiClient.patch('/persona/location', { latitude, longitude });
  },

  /**
   * 근처 페르소나 검색
   * @async
   * @param {number} latitude - 위도
   * @param {number} longitude - 경도
   * @param {number} [radiusKm=5] - 검색 반경 (km)
   * @returns {Promise<PersonaSettings[]>} 근처 페르소나 리스트
   * @description 지정된 반경 내의 다른 사용자 페르소나 검색
   *
   * @example
   * const nearbyPersonas = await personaApi.getNearbyPersonas(37.5665, 126.9780, 3);
   */
  getNearbyPersonas: async (
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<PersonaSettings[]> => {
    const response: any = await apiClient.get('/persona/nearby', {
      params: { latitude, longitude, radiusKm }
    });
    return response.data;
  },

  /**
   * 페르소나 삭제
   * @async
   * @returns {Promise<void>}
   * @description 현재 사용자의 페르소나 정보 삭제
   *
   * @example
   * await personaApi.deletePersona();
   */
  deletePersona: async (): Promise<void> => {
    await apiClient.delete('/persona/my');
  },
};