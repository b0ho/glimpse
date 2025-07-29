import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import apiClient from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notification-service';
import { navigationService } from '../navigation/navigationService';

const FCM_TOKEN_KEY = '@glimpse_fcm_token';

class FCMService {
  private static instance: FCMService;
  private fcmToken: string | null = null;

  private constructor() {}

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  /**
   * Initialize FCM and request permissions
   */
  async initialize(): Promise<void> {
    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
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
      messaging().onTokenRefresh(async (token) => {
        console.log('FCM token refreshed:', token);
        await this.registerToken(token);
      });

    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  /**
   * Get FCM token and register it with the server
   */
  async getAndRegisterToken(): Promise<void> {
    try {
      // Get token
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      if (token) {
        await this.registerToken(token);
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  /**
   * Register FCM token with the server
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
   * Remove FCM token (on logout)
   */
  async removeToken(): Promise<void> {
    try {
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      
      if (storedToken) {
        await apiClient.delete('/users/fcm/token', {
          data: { token: storedToken }
        });

        await AsyncStorage.removeItem(FCM_TOKEN_KEY);
        this.fcmToken = null;
        
        console.log('FCM token removed successfully');
      }
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  /**
   * Set up message handlers
   */
  private setupMessageHandlers(): void {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      // Show local notification when app is in foreground
      if (remoteMessage.notification) {
        await notificationService.showLocalNotification({
          title: remoteMessage.notification.title || '',
          body: remoteMessage.notification.body || '',
          data: remoteMessage.data,
        });
      }
    });

    // Handle background message
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
      
      // Handle background message (e.g., update badge count)
      if (remoteMessage.data?.type === 'message') {
        // Update unread message count
        await this.updateUnreadCount();
      }
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
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
   * Handle notification open
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
          navigationService.navigate('Chat', { 
            matchId: data.matchId, 
            roomId: data.roomId,
            otherUserNickname: data.fromUserNickname || '매치된 사용자'
          });
        }
        break;
        
      case 'MATCH_CREATED':
      case 'match':
        // Navigate to matches screen
        navigationService.navigate('Matches', undefined);
        break;
        
      case 'LIKE_RECEIVED':
      case 'like':
        // Navigate to who likes you screen (premium)
        navigationService.navigate('WhoLikesYou', undefined);
        break;
        
      case 'GROUP_INVITATION':
      case 'group_invite':
        // Navigate to join group screen
        if (data.inviteCode) {
          navigationService.navigate('JoinGroup', { inviteCode: data.inviteCode });
        }
        break;

      case 'PAYMENT_SUCCESS':
        // Navigate to premium screen
        navigationService.navigate('Premium', undefined);
        break;
        
      default:
        // Navigate to home
        navigationService.navigate('Home', undefined);
        break;
    }
  }

  /**
   * Update unread count (for badge)
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
   * Subscribe to topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
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

export const fcmService = FCMService.getInstance();