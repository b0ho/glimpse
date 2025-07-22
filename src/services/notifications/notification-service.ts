import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { NOTIFICATION_CONFIG } from '@/utils/constants/index';

export interface NotificationData {
  type: 'new_match' | 'new_message' | 'like_received' | 'super_like' | 'group_invite';
  userId?: string;
  groupId?: string;
  matchId?: string;
  messageId?: string;
  title: string;
  body: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  constructor() {
    this.configurePushNotifications();
  }

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

  // 새 매치 알림
  async notifyNewMatch(matchId: string, userName: string): Promise<void> {
    await this.schedulePushNotification({
      type: 'new_match',
      matchId,
      title: '🎉 새로운 매치!',
      body: `${userName}님과 서로 좋아요를 눌렀어요! 지금 대화를 시작해보세요.`,
    });
  }

  // 새 메시지 알림
  async notifyNewMessage(messageId: string, senderName: string, preview: string): Promise<void> {
    await this.schedulePushNotification({
      type: 'new_message',
      messageId,
      title: `💬 ${senderName}`,
      body: preview.length > 50 ? `${preview.substring(0, 47)}...` : preview,
    });
  }

  // 좋아요 받음 알림 (프리미엄 기능)
  async notifyLikeReceived(userId: string, isPremium: boolean): Promise<void> {
    if (!isPremium) return; // 프리미엄 사용자만 알림

    await this.schedulePushNotification({
      type: 'like_received',
      userId,
      title: '💖 누군가 당신을 좋아해요!',
      body: '프로필을 확인하고 매치를 만들어보세요.',
    });
  }

  // 슈퍼 좋아요 알림
  async notifySuperLike(userId: string, userName: string): Promise<void> {
    await this.schedulePushNotification({
      type: 'super_like',
      userId,
      title: '⭐ 슈퍼 좋아요!',
      body: `${userName}님이 당신에게 슈퍼 좋아요를 보냈어요!`,
    });
  }

  // 그룹 초대 알림
  async notifyGroupInvite(groupId: string, groupName: string): Promise<void> {
    await this.schedulePushNotification({
      type: 'group_invite',
      groupId,
      title: '👥 그룹 초대',
      body: `${groupName} 그룹에 초대되었습니다.`,
    });
  }

  // 모든 알림 취소
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // 특정 타입 알림 취소
  async cancelNotificationsByType(type: NotificationData['type']): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === type) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  // 알림 클릭 처리를 위한 리스너 등록
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // 앱이 foreground에 있을 때 알림 처리
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();