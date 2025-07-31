import apiClient from '@/services/api/apiClient';
import { 
  User, 
  UpdateProfileData, 
  ProfileUpdateResponse,
  Like,
  FriendRequest,
  Match,
} from '@shared/types';

class ProfileService {
  async getUserProfile(userId: string): Promise<User> {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<ProfileUpdateResponse> {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data;
  }

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

  async getLikesReceived(): Promise<Like[]> {
    const response = await apiClient.get('/likes/received');
    return response.data;
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    const response = await apiClient.get('/friends/requests');
    return response.data;
  }

  async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      await apiClient.post(`/friends/requests/${requestId}/accept`);
      return true;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      return false;
    }
  }

  async rejectFriendRequest(requestId: string): Promise<boolean> {
    try {
      await apiClient.post(`/friends/requests/${requestId}/reject`);
      return true;
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      return false;
    }
  }

  async getMatches(): Promise<Match[]> {
    const response = await apiClient.get('/matches');
    return response.data;
  }

  async updatePrivacySettings(settings: any): Promise<boolean> {
    try {
      await apiClient.put('/users/privacy-settings', settings);
      return true;
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      return false;
    }
  }

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

export default new ProfileService();