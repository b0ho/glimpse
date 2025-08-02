import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { NOTIFICATION_CONFIG } from '@/utils/constants/index';

/**
 * 알림 데이터 인터페이스
 * @interface NotificationData
 * @description 푸시 알림에 포함될 데이터 구조
 */
export interface NotificationData {
  /** 알림 타입 */
  type: 'new_match' | 'new_message' | 'like_received' | 'super_like' | 'group_invite';
  /** 사용자 ID */
  userId?: string;
  /** 그룹 ID */
  groupId?: string;
  /** 매칭 ID */
  matchId?: string;
  /** 메시지 ID */
  messageId?: string;
  /** 알림 제목 */
  title: string;
  /** 알림 내용 */
  body: string;
}

/**
 * 알림 서비스 클래스
 * @class NotificationService
 * @description Expo 기반 푸시 알림 관리 및 Android 채널 설정
 */
class NotificationService {
  /** Expo 푸시 토큰 */
  private expoPushToken: string | null = null;

  /**
   * NotificationService 생성자
   * @constructor
   * @description 푸시 알림 초기 설정 수행
   */
  constructor() {
    this.configurePushNotifications();
  }

  /**
   * 푸시 알림 설정
   * @private
   * @description 알림 핸들러 및 Android 채널 설정
   */
  private configurePushNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Android notification channel setup
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync(NOTIFICATION_CONFIG.CHANNELS.MATCHES, {
        name: NOTIFICATION_CONFIG.CHANNEL_NAMES.MATCHES,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      Notifications.setNotificationChannelAsync(NOTIFICATION_CONFIG.CHANNELS.MESSAGES, {
        name: NOTIFICATION_CONFIG.CHANNEL_NAMES.MESSAGES,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      Notifications.setNotificationChannelAsync(NOTIFICATION_CONFIG.CHANNELS.LIKES, {
        name: NOTIFICATION_CONFIG.CHANNEL_NAMES.LIKES,
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  /**
   * 알림 권한 요청
   * @async
   * @returns {Promise<boolean>} 권한 허용 여부
   * @description 사용자에게 푸시 알림 권한 요청
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  /**
   * Expo 푸시 토큰 가져오기
   * @async
   * @returns {Promise<string | null>} 푸시 토큰 또는 null
   * @description Expo 푸시 알림을 위한 토큰 생성 및 반환
   */
  async getExpoPushToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      return this.expoPushToken;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * 푸시 알림 예약
   * @async
   * @param {NotificationData} data - 알림 데이터
   * @returns {Promise<string>} 알림 ID
   * @description 즉시 또는 예약된 푸시 알림 생성
   */
  async schedulePushNotification(data: NotificationData): Promise<string> {
    const channelId = this.getChannelId(data.type);
    
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        data: {
          type: data.type,
          userId: data.userId,
          groupId: data.groupId,
          matchId: data.matchId,
          messageId: data.messageId,
        },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: null,
    });
  }

  /**
   * 채널 ID 가져오기
   * @private
   * @param {NotificationData['type']} type - 알림 타입
   * @returns {string} Android 채널 ID
   * @description 알림 타입에 따른 Android 채널 ID 반환
   */
  private getChannelId(type: NotificationData['type']): string {
    switch (type) {
      case 'new_match':
        return NOTIFICATION_CONFIG.CHANNELS.MATCHES;
      case 'new_message':
        return NOTIFICATION_CONFIG.CHANNELS.MESSAGES;
      case 'like_received':
      case 'super_like':
        return NOTIFICATION_CONFIG.CHANNELS.LIKES;
      default:
        return NOTIFICATION_CONFIG.CHANNELS.MATCHES;
    }
  }

  /**
   * 새 매치 알림
   * @async
   * @param {string} matchId - 매칭 ID
   * @param {string} userName - 상대방 이름
   * @returns {Promise<void>}
   * @description 서로 좋아요를 누른 매칭 성사 알림
   */
  async notifyNewMatch(matchId: string, userName: string): Promise<void> {
    await this.schedulePushNotification({
      type: 'new_match',
      matchId,
      title: '🎉 새로운 매치!',
      body: `${userName}님과 서로 좋아요를 눌렀어요! 지금 대화를 시작해보세요.`,
    });
  }

  /**
   * 새 메시지 알림
   * @async
   * @param {string} messageId - 메시지 ID
   * @param {string} senderName - 발신자 이름
   * @param {string} preview - 메시지 미리보기
   * @returns {Promise<void>}
   * @description 새로운 채팅 메시지 수신 알림
   */
  async notifyNewMessage(messageId: string, senderName: string, preview: string): Promise<void> {
    await this.schedulePushNotification({
      type: 'new_message',
      messageId,
      title: `💬 ${senderName}`,
      body: preview.length > 50 ? `${preview.substring(0, 47)}...` : preview,
    });
  }

  /**
   * 좋아요 받음 알림 (프리미엄 기능)
   * @async
   * @param {string} userId - 좋아요 보낸 사용자 ID
   * @param {boolean} isPremium - 프리미엄 사용자 여부
   * @returns {Promise<void>}
   * @description 프리미엄 사용자에게만 좋아요 받음 알림
   */
  async notifyLikeReceived(userId: string, isPremium: boolean): Promise<void> {
    if (!isPremium) return; // 프리미엄 사용자만 알림

    await this.schedulePushNotification({
      type: 'like_received',
      userId,
      title: '💖 누군가 당신을 좋아해요!',
      body: '프로필을 확인하고 매치를 만들어보세요.',
    });
  }

  /**
   * 슈퍼 좋아요 알림
   * @async
   * @param {string} userId - 슈퍼 좋아요 보낸 사용자 ID
   * @param {string} userName - 사용자 이름
   * @returns {Promise<void>}
   * @description 슈퍼 좋아요를 보냈을 때 알림
   */
  async notifySuperLike(userId: string, userName: string): Promise<void> {
    await this.schedulePushNotification({
      type: 'super_like',
      userId,
      title: '⭐ 슈퍼 좋아요!',
      body: `${userName}님이 당신에게 슈퍼 좋아요를 보냈어요!`,
    });
  }

  /**
   * 슈퍼 좋아요 받음 알림
   * @async
   * @param {string} likeId - 좋아요 ID
   * @param {string} userName - 슈퍼 좋아요 보낸 사용자 이름
   * @returns {Promise<void>}
   * @description 슈퍼 좋아요를 받았을 때 알림 (likeSlice에서 호출)
   */
  async notifySuperLikeReceived(likeId: string, userName: string): Promise<void> {
    await this.schedulePushNotification({
      type: 'super_like',
      userId: likeId,
      title: '⭐ 슈퍼 좋아요!',
      body: `${userName}님이 당신에게 슈퍼 좋아요를 보냈어요! 즉시 확인해보세요.`,
    });
  }

  /**
   * 슈퍼 매치 알림
   * @async
   * @param {string} matchId - 매칭 ID
   * @param {string} userName - 상대방 이름
   * @returns {Promise<void>}
   * @description 슈퍼 좋아요로 인한 특별한 매치 성사 알림
   */
  async notifySuperMatch(matchId: string, userName: string): Promise<void> {
    await this.schedulePushNotification({
      type: 'new_match',
      matchId,
      title: '🌟 슈퍼 매치!',
      body: `⭐ ${userName}님과 슈퍼 매치가 성사되었어요! 특별한 대화를 시작해보세요.`,
    });
  }

  /**
   * 그룹 초대 알림
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {string} groupName - 그룹 이름
   * @returns {Promise<void>}
   * @description 그룹 초대를 받았을 때 알림
   */
  async notifyGroupInvite(groupId: string, groupName: string): Promise<void> {
    await this.schedulePushNotification({
      type: 'group_invite',
      groupId,
      title: '👥 그룹 초대',
      body: `${groupName} 그룹에 초대되었습니다.`,
    });
  }

  /**
   * 모든 알림 취소
   * @async
   * @returns {Promise<void>}
   * @description 예약된 모든 알림을 취소
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * 특정 타입 알림 취소
   * @async
   * @param {NotificationData['type']} type - 취소할 알림 타입
   * @returns {Promise<void>}
   * @description 특정 타입의 예약된 알림만 취소
   */
  async cancelNotificationsByType(type: NotificationData['type']): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === type) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  /**
   * 알림 클릭 리스너 등록
   * @param {Function} callback - 알림 클릭 시 호출될 콜백
   * @returns {object} 리스너 구독 객체
   * @description 사용자가 알림을 클릭했을 때 처리
   */
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * 포그라운드 알림 리스너 등록
   * @param {Function} callback - 알림 수신 시 호출될 콜백
   * @returns {object} 리스너 구독 객체
   * @description 앱이 포그라운드에 있을 때 알림 수신 처리
   */
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

/**
 * 알림 서비스 싱글톤 인스턴스
 * @constant {NotificationService}
 * @description 앱 전체에서 사용할 알림 서비스 인스턴스
 */
export const notificationService = new NotificationService();