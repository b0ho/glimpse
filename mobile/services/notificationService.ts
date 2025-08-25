import { Platform } from 'react-native';
import { API_BASE_URL } from './api/config';
// import { authService } from './auth/auth-service'; // TODO: Implement token handling

// 조건부로 expo-notifications import (Expo Go 호환성)
let Notifications: any = null;
let Device: any = null;
let Constants: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants');
  
  /**
   * 알림 핸들러 설정
   * @description 알림이 수신될 때의 기본 동작 설정
   */
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (error) {
  console.warn('Notifications not available in this environment');
}

/**
 * 알림 데이터 인터페이스
 * @interface NotificationData
 * @property {string} type - 알림 유형
 * @property {string} [notificationId] - 알림 ID
 * @property {string} [fromUserId] - 발신자 ID
 * @property {string} [toUserId] - 수신자 ID
 * @property {string} [groupId] - 그룹 ID
 * @property {string} [matchId] - 매칭 ID
 * @property {string} [amount] - 금액
 * @property {string} [credits] - 크레딧
 */
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

/**
 * 알림 서비스 클래스
 * @class NotificationService
 * @description 푸시 알림 등록, 수신, 관리 기능 제공
 */
class NotificationService {
  /** 알림 수신 리스너 */
  private notificationListener: any;
  /** 알림 응답 리스너 */
  private responseListener: any;

  /**
   * 푸시 알림 등록
   * @async
   * @returns {Promise<string | null>} 푸시 토큰 또는 null
   * @description 디바이스에 푸시 알림을 등록하고 토큰을 서버에 전송
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Notifications 모듈이 없으면 null 반환
    if (!Notifications || !Device || !Constants) {
      console.log('알림 기능이 이 환경에서 지원되지 않습니다.');
      return null;
    }

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

  /**
   * 서버에 토큰 등록
   * @private
   * @async
   * @param {string} token - FCM 토큰
   * @returns {Promise<void>}
   * @description FCM 토큰을 백엔드 서버에 등록
   */
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

  /**
   * 푸시 토큰 제거
   * @async
   * @param {string} token - 제거할 FCM 토큰
   * @returns {Promise<void>}
   * @description 서버에서 FCM 토큰을 제거
   */
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

  /**
   * 알림 리스너 설정
   * @param {Function} [onNotificationReceived] - 알림 수신 콜백
   * @param {Function} [onNotificationResponse] - 알림 탭 콜백
   * @description 알림 수신 및 사용자 응답 리스너 설정
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationResponse?: (response: any) => void
  ): void {
    // Notifications 모듈이 없으면 리턴
    if (!Notifications) {
      console.log('알림 리스너를 설정할 수 없습니다.');
      return;
    }

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

  /**
   * 알림 리스너 제거
   * @description 등록된 알림 리스너를 모두 제거
   */
  removeNotificationListeners(): void {
    if (!Notifications) {
      return;
    }
    
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * 알림 목록 조회
   * @async
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=20] - 페이지당 항목 수
   * @returns {Promise<any>} 알림 목록
   * @throws {Error} 조회 실패 시
   * @description 서버에서 알림 목록을 가져오기
   */
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

  /**
   * 알림 읽음 처리
   * @async
   * @param {string} notificationId - 알림 ID
   * @returns {Promise<void>}
   * @throws {Error} 읽음 처리 실패 시
   * @description 특정 알림을 읽음 상태로 변경
   */
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

  /**
   * 모든 알림 읽음 처리
   * @async
   * @returns {Promise<void>}
   * @throws {Error} 읽음 처리 실패 시
   * @description 모든 미읽은 알림을 읽음 상태로 변경
   */
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

  /**
   * 통화 알림 표시
   * @async
   * @param {string} callerName - 발신자 이름
   * @param {'video' | 'audio'} callType - 통화 유형
   * @returns {Promise<void>}
   * @description 수신 통화 알림을 로컬로 표시
   */
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

  /**
   * 통화 알림 제거
   * @async
   * @returns {Promise<void>}
   * @description 표시된 통화 알림을 제거
   */
  async clearCallNotification() {
    try {
      await Notifications.dismissNotificationAsync('incoming-call');
    } catch (error) {
      console.error('Failed to clear call notification:', error);
    }
  }

  /**
   * 미읽은 알림 개수 조회
   * @async
   * @returns {Promise<number>} 미읽은 알림 개수
   * @description 서버에서 미읽은 알림 개수를 가져오기
   */
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

  /**
   * 알림 삭제
   * @async
   * @param {string} notificationId - 삭제할 알림 ID
   * @returns {Promise<void>}
   * @throws {Error} 삭제 실패 시
   * @description 특정 알림을 삭제
   */
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

  /**
   * 로컬 알림 표시
   * @async
   * @param {string} title - 알림 제목
   * @param {string} body - 알림 내용
   * @param {NotificationData} [data] - 알림 데이터
   * @returns {Promise<void>}
   * @description 앱이 포그라운드에 있을 때 로컬 알림 표시
   */
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

  /**
   * 배지 카운트 설정
   * @async
   * @param {number} count - 배지 카운트
   * @returns {Promise<void>}
   * @description iOS에서 앱 아이콘의 배지 카운트 설정
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  }

  /**
   * 배지 카운트 가져오기
   * @async
   * @returns {Promise<number>} 현재 배지 카운트
   * @description iOS에서 현재 앱 아이콘의 배지 카운트 가져오기
   */
  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'ios') {
      return await Notifications.getBadgeCountAsync();
    }
    return 0;
  }
}

/**
 * 알림 서비스 싱글톤 인스턴스
 * @constant {NotificationService}
 * @description 앱 전체에서 사용할 알림 서비스 인스턴스
 */
export const notificationService = new NotificationService();