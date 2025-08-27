import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { RootStackParamList } from '@/types/navigation';

// 조건부로 expo-notifications import (Expo Go 호환성)
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('Notifications not available in useNotifications hook');
}

export function useNotifications() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  
  const initializeNotifications = useNotificationStore(state => state.initializeNotifications);
  const isInitialized = useNotificationStore(state => state.isInitialized);
  const settings = useNotificationStore(state => state.settings);
  const addPendingNotification = useNotificationStore(state => state.addPendingNotification);
  
  const isPremium = usePremiumStore(premiumSelectors.isPremiumUser());
  const isSignedIn = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    // Initialize notifications when user is signed in
    if (isSignedIn && !isInitialized) {
      initializeNotifications();
    }
  }, [isSignedIn, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !settings.pushEnabled || !Notifications) {
      return;
    }

    // Listener for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received in foreground:', notification);
      
      // Store notification for potential display
      const data = notification.request.content.data;
      if (data && typeof data === 'object' && 'type' in data) {
        addPendingNotification({
          type: data.type as 'new_match' | 'new_message' | 'like_received' | 'group_invite',
          userId: data.userId as string,
          groupId: data.groupId as string,
          matchId: data.matchId as string,
          messageId: data.messageId as string,
          title: notification.request.content.title || '',
          body: notification.request.content.body || '',
        });
      }
    });

    // Listener for notification interactions (taps)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      if (data && typeof data === 'object') {
        // 알림 응답 지연 처리 (네비게이션 준비 대기)
        setTimeout(() => {
          handleNotificationPress(data as { type: string; userId?: string; groupId?: string; matchId?: string; messageId?: string; roomId?: string });
        }, 500); // 0.5초 대기
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isInitialized, settings.pushEnabled]);

  const handleNotificationPress = (data: { type: string; userId?: string; groupId?: string; matchId?: string; messageId?: string; roomId?: string }) => {
    try {
      switch (data.type) {
        case 'new_match':
          if (data.matchId) {
            navigation.navigate('Matches');
          }
          break;
          
        case 'new_message':
          if (data.messageId) {
            // Navigate to specific chat
navigation.navigate('Chat', { 
              roomId: data.roomId || '',
              matchId: data.matchId || data.userId || '',
              otherUserNickname: '익명사용자'
            });
          }
          break;
          
        case 'like_received':
          if (isPremium) {
            navigation.navigate('Matches');
          }
          break;
          
        case 'super_like':
          navigation.navigate('Matches');
          break;
          
        case 'group_invite':
          if (data.groupId) {
            navigation.navigate('Groups');
          }
          break;
          
        default:
  navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
      navigation.navigate('Home' as never);
    }
  };

  return {
    isInitialized,
    settings,
    handleNotificationPress,
  };
}