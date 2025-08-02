import { apiClient } from './config';
import { UserResponse, UserCreateRequest, UserUpdateRequest } from '@shared/types';

/**
 * 사용자 관리 API 서비스
 * @namespace userApiService
 * @description 사용자 정보 조회, 생성, 수정, 삭제 API
 */
export const userApiService = {
  /**
   * 현재 사용자 정보 조회
   * @async
   * @returns {Promise<UserResponse>} 현재 로그인한 사용자 정보
   * @description 토큰을 기반으로 현재 사용자의 정보를 가져오기
   */
  async getCurrentUser(): Promise<UserResponse> {
    return apiClient.get<UserResponse>('/users/me');
  },

  /**
   * 사용자 생성
   * @async
   * @param {UserCreateRequest} data - 사용자 생성 데이터
   * @returns {Promise<UserResponse>} 생성된 사용자 정보
   * @description 회원가입 후 새로운 사용자 프로필 생성
   */
  async createUser(data: UserCreateRequest): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/users', data);
  },

  /**
   * 사용자 정보 수정
   * @async
   * @param {string} userId - 사용자 ID
   * @param {UserUpdateRequest} data - 업데이트할 사용자 데이터
   * @returns {Promise<UserResponse>} 수정된 사용자 정보
   * @description 프로필, 설정 등 사용자 정보 업데이트
   */
  async updateUser(userId: string, data: UserUpdateRequest): Promise<UserResponse> {
    return apiClient.put<UserResponse>(`/users/${userId}`, data);
  },

  /**
   * 사용자 삭제
   * @async
   * @param {string} userId - 삭제할 사용자 ID
   * @returns {Promise<void>}
   * @description 사용자 계정 영구 삭제 (비활성화)
   */
  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete<void>(`/users/${userId}`);
  },

  /**
   * 특정 사용자 조회
   * @async
   * @param {string} userId - 조회할 사용자 ID
   * @returns {Promise<UserResponse>} 사용자 정보
   * @description ID로 특정 사용자의 공개 정보 조회
   */
  async getUserById(userId: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/users/${userId}`);
  },
};