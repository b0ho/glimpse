import { apiClient } from './config';
import { UserResponse, UserCreateRequest, UserUpdateRequest } from '@shared/types';

export const userApiService = {
  // 현재 사용자 정보 조회
  async getCurrentUser(): Promise<UserResponse> {
    return apiClient.get<UserResponse>('/users/me');
  },

  // 사용자 생성 (회원가입 후)
  async createUser(data: UserCreateRequest): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/users', data);
  },

  // 사용자 정보 수정
  async updateUser(userId: string, data: UserUpdateRequest): Promise<UserResponse> {
    return apiClient.put<UserResponse>(`/users/${userId}`, data);
  },

  // 사용자 삭제
  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete<void>(`/users/${userId}`);
  },

  // 특정 사용자 조회
  async getUserById(userId: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/users/${userId}`);
  },
};