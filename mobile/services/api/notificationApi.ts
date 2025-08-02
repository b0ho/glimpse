import apiClient from './config';

/**
 * 알림 설정 인터페이스
 * @interface NotificationSettings
 * @property {boolean} pushEnabled - 푸시 알림 활성화 여부
 * @property {boolean} newMessages - 새 메시지 알림
 * @property {boolean} newMatches - 새 매칭 알림
 * @property {boolean} likes - 좋아요 알림
 * @property {boolean} groupInvites - 그룹 초대 알림
 * @property {boolean} marketing - 마케팅 알림
 */
export interface NotificationSettings {
  pushEnabled: boolean;
  newMessages: boolean;
  newMatches: boolean;
  likes: boolean;
  groupInvites: boolean;
  marketing: boolean;
}

/**
 * 알림 관리 API 서비스
 * @namespace notificationApi
 * @description FCM 토큰 관리, 알림 설정, 알림 목록 관리 API
 */
export const notificationApi = {
  /**
   * FCM 토큰 등록
   * @async
   * @param {string} token - FCM 토큰
   * @param {'ios' | 'android'} deviceType - 디바이스 유형
   * @returns {Promise<void>}
   * @description 푸시 알림을 위한 FCM 토큰을 서버에 등록
   */
  async registerFCMToken(token: string, deviceType: 'ios' | 'android'): Promise<void> {
    await apiClient.post('/users/fcm/token', {
      token,
      deviceType
    });
  },

  /**
   * FCM 토큰 제거
   * @async
   * @param {string} token - 제거할 FCM 토큰
   * @returns {Promise<void>}
   * @description 서버에서 FCM 토큰을 제거하여 푸시 알림 중지
   */
  async removeFCMToken(token: string): Promise<void> {
    await apiClient.delete('/users/fcm/token', {
      data: { token }
    });
  },

  /**
   * 알림 설정 업데이트
   * @async
   * @param {Partial<NotificationSettings>} settings - 업데이트할 알림 설정
   * @returns {Promise<NotificationSettings>} 업데이트된 설정
   * @description 사용자의 알림 설정을 부분적으로 업데이트
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await apiClient.put('/users/notifications/settings', settings);
    return response.data.data;
  },

  /**
   * 알림 설정 조회
   * @async
   * @returns {Promise<NotificationSettings>} 현재 알림 설정
   * @description 사용자의 현재 알림 설정을 가져오기
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get('/users/notifications/settings');
    return response.data.data;
  },

  /**
   * 알림 목록 조회
   * @async
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=20] - 페이지당 항목 수
   * @returns {Promise<any[]>} 알림 리스트
   * @description 사용자의 알림 목록을 페이지네이션하여 조회
   */
  async getNotifications(page = 1, limit = 20): Promise<any[]> {
    const response = await apiClient.get('/notifications', {
      params: { page, limit }
    });
    return response.data.data;
  },

  /**
   * 알림 읽음 처리
   * @async
   * @param {string} notificationId - 알림 ID
   * @returns {Promise<void>}
   * @description 특정 알림을 읽음 상태로 변경
   */
  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.put(`/notifications/${notificationId}/read`);
  },

  /**
   * 모든 알림 읽음 처리
   * @async
   * @returns {Promise<void>}
   * @description 모든 미읽은 알림을 읽음 상태로 변경
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.put('/notifications/read-all');
  },

  /**
   * 알림 삭제
   * @async
   * @param {string} notificationId - 삭제할 알림 ID
   * @returns {Promise<void>}
   * @description 특정 알림을 삭제
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * 미읽은 알림 개수 조회
   * @async
   * @returns {Promise<number>} 미읽은 알림 개수
   * @description 사용자의 미읽은 알림 개수를 가져오기
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data.count;
  }
};