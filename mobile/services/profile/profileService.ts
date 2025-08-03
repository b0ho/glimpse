import apiClient from '../api/config';
import { 
  User, 
  UpdateProfileData, 
  ProfileUpdateResponse,
  Like,
  FriendRequest,
  Match,
} from '@shared/types';

/**
 * 프로필 서비스 클래스
 * @class ProfileService
 * @description 사용자 프로필, 친구 요청, 매칭, 설정 관리
 */
class ProfileService {
  /**
   * 사용자 프로필 조회
   * @async
   * @param {string} userId - 사용자 ID
   * @returns {Promise<User>} 사용자 정보
   * @description 특정 사용자의 프로필 정보 조회
   */
  async getUserProfile(userId: string): Promise<User> {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  }

  /**
   * 프로필 업데이트
   * @async
   * @param {string} userId - 사용자 ID
   * @param {UpdateProfileData} data - 업데이트할 프로필 데이터
   * @returns {Promise<ProfileUpdateResponse>} 업데이트 결과
   * @description 사용자 프로필 정보 업데이트
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<ProfileUpdateResponse> {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data;
  }

  /**
   * 프로필 이미지 업로드
   * @async
   * @param {string} userId - 사용자 ID
   * @param {string} imageUri - 이미지 URI
   * @returns {Promise<string>} 업로드된 이미지 URL
   * @description 프로필 이미지를 서버에 업로드
   */
  async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    const response = await apiClient.post(`/users/${userId}/profile-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.imageUrl;
  }

  /**
   * 받은 좋아요 목록 조회
   * @async
   * @returns {Promise<Like[]>} 받은 좋아요 목록
   * @description 내가 받은 좋아요 목록 조회 (프리미엄 기능)
   */
  async getLikesReceived(): Promise<Like[]> {
    const response = await apiClient.get('/likes/received');
    return response.data;
  }

  /**
   * 친구 요청 목록 조회
   * @async
   * @returns {Promise<FriendRequest[]>} 친구 요청 목록
   * @description 받은 친구 요청 목록 조회
   */
  async getFriendRequests(): Promise<FriendRequest[]> {
    const response = await apiClient.get('/friends/requests');
    return response.data;
  }

  /**
   * 친구 요청 수락
   * @async
   * @param {string} requestId - 친구 요청 ID
   * @returns {Promise<boolean>} 성공 여부
   * @description 친구 요청을 수락하고 친구 관계 생성
   */
  async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      await apiClient.post(`/friends/requests/${requestId}/accept`);
      return true;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      return false;
    }
  }

  /**
   * 친구 요청 거절
   * @async
   * @param {string} requestId - 친구 요청 ID
   * @returns {Promise<boolean>} 성공 여부
   * @description 친구 요청을 거절
   */
  async rejectFriendRequest(requestId: string): Promise<boolean> {
    try {
      await apiClient.post(`/friends/requests/${requestId}/reject`);
      return true;
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      return false;
    }
  }

  /**
   * 매칭 목록 조회
   * @async
   * @returns {Promise<Match[]>} 매칭 목록
   * @description 서로 좋아요를 누른 매칭 목록 조회
   */
  async getMatches(): Promise<Match[]> {
    const response = await apiClient.get('/matches');
    return response.data;
  }

  /**
   * 개인정보 설정 업데이트
   * @async
   * @param {any} settings - 개인정보 설정
   * @returns {Promise<boolean>} 성공 여부
   * @description 사용자의 개인정보 보호 설정 업데이트
   */
  async updatePrivacySettings(settings: any): Promise<boolean> {
    try {
      await apiClient.put('/users/privacy-settings', settings);
      return true;
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      return false;
    }
  }

  /**
   * 알림 설정 업데이트
   * @async
   * @param {any} settings - 알림 설정
   * @returns {Promise<boolean>} 성공 여부
   * @description 사용자의 알림 설정 업데이트
   */
  async updateNotificationSettings(settings: any): Promise<boolean> {
    try {
      await apiClient.put('/users/notification-settings', settings);
      return true;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      return false;
    }
  }
}

/**
 * 프로필 서비스 인스턴스
 * @constant {ProfileService}
 * @description 앱 전체에서 사용할 프로필 서비스 인스턴스
 */
export default new ProfileService();