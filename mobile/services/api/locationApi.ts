/**
 * 위치 API 서비스
 * @module api/locationApi
 * @description 위치 기반 그룹 및 사용자 관련 API
 */

import apiClient from './config';
import { Group, User } from '@shared/types';

/**
 * 위치 기반 그룹 응답
 * @interface LocationGroupResponse
 */
interface LocationGroupResponse {
  groups: Group[];
  total: number;
}

/**
 * 근처 사용자 응답
 * @interface NearbyUsersResponse
 */
interface NearbyUsersResponse {
  users: User[];
  total: number;
}

/**
 * 위치 API 서비스
 * @namespace locationApi
 */
export const locationApi = {
  /**
   * 근처 그룹 조회
   * @async
   * @param {Object} params - 조회 파라미터
   * @param {number} params.latitude - 위도
   * @param {number} params.longitude - 경도
   * @param {number} params.radius - 반경 (미터)
   * @returns {Promise<LocationGroupResponse>} 그룹 목록
   */
  async getNearbyGroups(params: {
    latitude: number;
    longitude: number;
    radius: number;
  }): Promise<LocationGroupResponse> {
    const response = await apiClient.get<{ data: LocationGroupResponse }>('/groups/nearby', params);
    return response.data;
  },

  /**
   * 근처 사용자 조회
   * @async
   * @param {Object} params - 조회 파라미터
   * @param {number} params.latitude - 위도
   * @param {number} params.longitude - 경도
   * @param {number} params.radius - 반경 (미터)
   * @returns {Promise<NearbyUsersResponse>} 사용자 목록
   */
  async getNearbyUsers(params: {
    latitude: number;
    longitude: number;
    radius: number;
  }): Promise<NearbyUsersResponse> {
    const response = await apiClient.get<{ data: NearbyUsersResponse }>('/users/nearby', params);
    return response.data;
  },

  /**
   * 위치 업데이트
   * @async
   * @param {Object} location - 위치 정보
   * @param {number} location.latitude - 위도
   * @param {number} location.longitude - 경도
   * @returns {Promise<void>}
   */
  async updateLocation(location: {
    latitude: number;
    longitude: number;
  }): Promise<void> {
    await apiClient.put('/users/location', location);
  },

  /**
   * 위치 기반 그룹 생성
   * @async
   * @param {Object} data - 그룹 생성 데이터
   * @param {string} data.name - 그룹명
   * @param {string} [data.description] - 그룹 설명
   * @param {number} data.latitude - 위도
   * @param {number} data.longitude - 경도
   * @param {number} data.radius - 반경 (미터)
   * @returns {Promise<Group>} 생성된 그룹
   */
  async createLocationGroup(data: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    radius: number;
  }): Promise<Group> {
    const response = await apiClient.post<{ data: Group }>('/groups/location', data);
    return response.data;
  },

  /**
   * 위치 검증 (QR 코드)
   * @async
   * @param {string} qrCode - QR 코드 데이터
   * @returns {Promise<{ valid: boolean; groupId?: string }>} 검증 결과
   */
  async verifyLocationQR(qrCode: string): Promise<{ valid: boolean; groupId?: string }> {
    const response = await apiClient.post<{ data: { valid: boolean; groupId?: string } }>('/location/verify-qr', { qrCode });
    return response.data;
  }
};