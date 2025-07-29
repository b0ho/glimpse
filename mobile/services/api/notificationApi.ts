import apiClient from './config';

export interface NotificationSettings {
  pushEnabled: boolean;
  newMessages: boolean;
  newMatches: boolean;
  likes: boolean;
  groupInvites: boolean;
  marketing: boolean;
}

export const notificationApi = {
  /**
   * Register FCM token
   */
  async registerFCMToken(token: string, deviceType: 'ios' | 'android'): Promise<void> {
    await apiClient.post('/users/fcm/token', {
      token,
      deviceType
    });
  },

  /**
   * Remove FCM token
   */
  async removeFCMToken(token: string): Promise<void> {
    await apiClient.delete('/users/fcm/token', {
      data: { token }
    });
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await apiClient.put('/users/notifications/settings', settings);
    return response.data.data;
  },

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get('/users/notifications/settings');
    return response.data.data;
  },

  /**
   * Get notifications
   */
  async getNotifications(page = 1, limit = 20): Promise<any[]> {
    const response = await apiClient.get('/notifications', {
      params: { page, limit }
    });
    return response.data.data;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.put(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.put('/notifications/read-all');
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data.count;
  }
};