import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URL } from './api/config';
// import { authService } from './auth/auth-service'; // TODO: Implement token handling

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: string;
  notificationId?: string;
  fromUserId?: string;
  toUserId?: string;
  groupId?: string;
  matchId?: string;
  amount?: string;
  credits?: string;
  [key: string]: any;
}

class NotificationService {
  private notificationListener: any;
  private responseListener: any;

  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('물리적 디바이스가 아니면 푸시 알림을 사용할 수 없습니다.');
      return null;
    }

    try {
      // 권한 확인
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('푸시 알림 권한이 거부되었습니다.');
        return null;
      }

      // FCM 토큰 가져오기
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      console.log('푸시 토큰:', token);

      // 서버에 토큰 등록
      await this.registerTokenWithServer(token);

      return token;
    } catch (error) {
      console.error('푸시 알림 등록 오류:', error);
      return null;
    }
  }

  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      // TODO: Get token from Clerk
      const authToken = '';
      if (!authToken) {
        console.log('인증 토큰이 없습니다.');
        return;
      }

      const deviceType = Platform.OS as 'ios' | 'android';

      const response = await fetch(`${API_BASE_URL}/notifications/fcm/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token,
          deviceType,
        }),
      });

      if (!response.ok) {
        throw new Error('FCM 토큰 등록 실패');
      }

      console.log('FCM 토큰이 서버에 등록되었습니다.');
    } catch (error) {
      console.error('FCM 토큰 등록 오류:', error);
    }
  }

  async removePushToken(token: string): Promise<void> {
    try {
      // TODO: Get token from Clerk
      const authToken = '';
      if (!authToken) return;

      await fetch(`${API_BASE_URL}/notifications/fcm/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      console.error('FCM 토큰 제거 오류:', error);
    }
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    // 알림 수신 리스너
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('알림 수신:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // 알림 응답 리스너 (사용자가 알림을 탭했을 때)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('알림 응답:', response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });
  }

  removeNotificationListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  async getNotifications(page: number = 1, limit: number = 20) {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('알림 목록 가져오기 실패');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('알림 목록 가져오기 오류:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('알림 읽음 처리 실패');
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }

      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('모든 알림 읽음 처리 실패');
      }
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error);
      throw error;
    }
  }

  async showCallNotification(callerName: string, callType: 'video' | 'audio') {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${callerName}님의 ${callType === 'video' ? '영상' : '음성'} 통화`,
          body: '탭하여 통화에 응답하세요',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'call',
          data: { type: 'incoming_call', callType },
        },
        trigger: null,
        identifier: 'incoming-call',
      });
    } catch (error) {
      console.error('Failed to show call notification:', error);
    }
  }

  async clearCallNotification() {
    try {
      await Notifications.dismissNotificationAsync('incoming-call');
    } catch (error) {
      console.error('Failed to clear call notification:', error);
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        return 0;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('읽지 않은 알림 개수 가져오기 실패');
      }

      const data = await response.json();
      return data.data.unreadCount;
    } catch (error) {
      console.error('읽지 않은 알림 개수 가져오기 오류:', error);
      return 0;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('알림 삭제 실패');
      }
    } catch (error) {
      console.error('알림 삭제 오류:', error);
      throw error;
    }
  }

  // 로컬 알림 표시 (앱이 포그라운드에 있을 때)
  async showLocalNotification(
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // 즉시 표시
    });
  }

  // 배지 카운트 설정
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  }

  // 배지 카운트 가져오기
  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'ios') {
      return await Notifications.getBadgeCountAsync();
    }
    return 0;
  }
}

export const notificationService = new NotificationService();