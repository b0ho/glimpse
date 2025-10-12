// import messaging from '@react-native-firebase/messaging';
// TODO: Install @react-native-firebase/messaging package
const messaging = {
  getToken: async () => 'mock-token',
  requestPermission: async () => 1,
  hasPermission: async () => 1,
  onMessage: (handler: any) => () => {},
  onNotificationOpenedApp: (handler: any) => () => {},
  getInitialNotification: async () => null,
  setBackgroundMessageHandler: (handler: any) => {},
  onTokenRefresh: (handler: any) => () => {},
  subscribeToTopic: async (topic: string) => {},
  unsubscribeFromTopic: async (topic: string) => {},
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  }
} as any;
import { Platform } from 'react-native';
import apiClient from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notification-service';
import { navigationService } from '../navigation/navigationService';

/** FCM 토큰 저장 키 */
const FCM_TOKEN_KEY = '@glimpse_fcm_token';

/**
 * FCM 서비스 클래스
 * @class FCMService
 * @description Firebase Cloud Messaging을 통한 푸시 알림 관리
 */
class FCMService {
  /** 싱글톤 인스턴스 */
  private static instance: FCMService;
  /** FCM 토큰 */
  private fcmToken: string | null = null;

  /**
   * FCMService 생성자
   * @private
   * @constructor
   */
  private constructor() {}

  /**
   * 싱글톤 인스턴스 가져오기
   * @static
   * @returns {FCMService} FCM 서비스 인스턴스
   */
  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  /**
   * FCM 초기화 및 권한 요청
   * @async
   * @returns {Promise<void>}
   * @description FCM을 초기화하고 알림 권한을 요청하며 메시지 핸들러 설정
   */
  async initialize(): Promise<void> {
    try {
      // Request permission
      const authStatus = await messaging.requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Notification permission not granted');
        return;
      }

      console.log('Notification permission granted');

      // Get FCM token
      await this.getAndRegisterToken();

      // Set up message handlers
      this.setupMessageHandlers();

      // Handle token refresh
      messaging.onTokenRefresh(async (token: string) => {
        console.log('FCM token refreshed:', token);
        await this.registerToken(token);
      });

    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  /**
   * FCM 토큰 가져오기 및 서버 등록
   * @async
   * @returns {Promise<void>}
   * @description FCM 토큰을 가져와서 백엔드 서버에 등록
   */
  async getAndRegisterToken(): Promise<void> {
    try {
      // Get token
      const token = await messaging.getToken();
      console.log('FCM Token:', token);

      if (token) {
        await this.registerToken(token);
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  /**
   * FCM 토큰 서버 등록
   * @async
   * @param {string} token - FCM 토큰
   * @returns {Promise<void>}
   * @description 토큰이 변경된 경우에만 서버에 등록
   */
  async registerToken(token: string): Promise<void> {
    try {
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      
      // Only register if token is different from stored one
      if (storedToken !== token) {
        await apiClient.post('/users/fcm/token', {
          token,
          deviceType: Platform.OS as 'ios' | 'android'
        });

        // Store token locally
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        this.fcmToken = token;
        
        console.log('FCM token registered successfully');
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  }

  /**
   * FCM 토큰 제거 (로그아웃 시)
   * @async
   * @returns {Promise<void>}
   * @description 서버에서 토큰을 제거하고 로컬 저장소에서도 삭제
   */
  async removeToken(): Promise<void> {
    try {
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      
      if (storedToken) {
        await apiClient.delete('/users/fcm/token');

        await AsyncStorage.removeItem(FCM_TOKEN_KEY);
        this.fcmToken = null;
        
        console.log('FCM token removed successfully');
      }
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  /**
   * 메시지 핸들러 설정
   * @private
   * @description 포그라운드, 백그라운드, 알림 오픈 이벤트 핸들러 설정
   */
  private setupMessageHandlers(): void {
    // Handle foreground messages
    messaging.onMessage(async (remoteMessage: any) => {
      console.log('Foreground message received:', remoteMessage);
      
      // Show local notification when app is in foreground
      if (remoteMessage.notification) {
        // TODO: Implement showLocalNotification in notificationService
        // await notificationService.showLocalNotification({
        //   title: remoteMessage.notification.title || '',
        //   body: remoteMessage.notification.body || '',
        //   data: remoteMessage.data,
        // });
      }
    });

    // Handle background message
    messaging.setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('Background message received:', remoteMessage);
      
      // Handle background message (e.g., update badge count)
      if (remoteMessage.data?.type === 'message') {
        // Update unread message count
        await this.updateUnreadCount();
      }
    });

    // Handle notification opened app
    messaging.onNotificationOpenedApp((remoteMessage: any) => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          // Delay to ensure navigation is ready
          setTimeout(() => {
            this.handleNotificationOpen(remoteMessage);
          }, 1000);
        }
      });
  }

  /**
   * 알림 오픈 처리
   * @private
   * @param {any} remoteMessage - FCM 메시지 객체
   * @description 알림 타입에 따라 적절한 화면으로 네비게이션
   */
  private handleNotificationOpen(remoteMessage: any): void {
    const data = remoteMessage.data;
    
    if (!data) return;

    // Navigate based on notification type
    switch (data.type) {
      case 'MESSAGE_RECEIVED':
      case 'message':
        // Navigate to chat screen
        if (data.matchId && data.roomId) {
          navigationService.navigate('Chat' as never, {
            matchId: data.matchId,
            roomId: data.roomId,
            otherUserNickname: data.fromUserNickname || '매치된 사용자'
          } as never);
        }
        break;

      case 'MATCH_CREATED':
      case 'match':
        // Navigate to matches screen
        navigationService.navigate('Matches' as never);
        break;

      case 'LIKE_RECEIVED':
      case 'like':
        // Navigate to who likes you screen (premium)
        navigationService.navigate('WhoLikesYou' as never);
        break;

      case 'GROUP_INVITATION':
      case 'group_invite':
        // Navigate to join group screen
        if (data.inviteCode) {
          navigationService.navigate('JoinGroup' as never, { inviteCode: data.inviteCode } as never);
        }
        break;

      case 'PAYMENT_SUCCESS':
        // Navigate to premium screen
        navigationService.navigate('Premium' as never);
        break;

      default:
        // Navigate to home
        navigationService.navigate('Home' as never);
        break;
    }
  }

  /**
   * 읽지 않은 메시지 수 업데이트 (배지용)
   * @private
   * @async
   * @returns {Promise<void>}
   * @description 앱 배지에 표시될 읽지 않은 메시지 수 업데이트
   */
  private async updateUnreadCount(): Promise<void> {
    try {
      // Get unread count from API or local storage
      // Update app badge
      // notificationService.setBadgeCount(unreadCount);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  }

  /**
   * 토픽 구독
   * @async
   * @param {string} topic - 구독할 토픽명
   * @returns {Promise<void>}
   * @description FCM 토픽을 구독하여 그룹 메시지 수신
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging.subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  /**
   * 토픽 구독 해제
   * @async
   * @param {string} topic - 구독 해제할 토픽명
   * @returns {Promise<void>}
   * @description FCM 토픽 구독을 해제
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging.unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  /**
   * 알림 활성화 상태 확인
   * @async
   * @returns {Promise<boolean>} 알림 활성화 여부
   * @description 현재 알림 권한이 허용되어 있는지 확인
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const authStatus = await messaging.hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  /**
   * 알림 권한 요청
   * @async
   * @returns {Promise<boolean>} 권한 허용 여부
   * @description 사용자에게 알림 권한을 요청하고 결과 반환
   */
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging.requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // Re-register token after permission granted
        await this.getAndRegisterToken();
      }

      return enabled;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }
}

/**
 * FCM 서비스 싱글톤 인스턴스
 * @constant {FCMService}
 * @description 앱 전체에서 사용할 FCM 서비스 인스턴스
 */
export const fcmService = FCMService.getInstance();