/**
 * Notifications Management Hook
 *
 * @module hooks/useNotifications
 * @description 푸시 알림의 초기화, 수신, 상호작용을 관리합니다.
 * 로그인한 사용자에 대해 자동으로 알림을 초기화하고, foreground/background 알림을 처리합니다.
 */

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

/**
 * 알림 관리 훅
 *
 * @hook
 * @returns {Object} 알림 관련 상태 및 함수들
 * @returns {boolean} returns.isInitialized - 알림 시스템 초기화 여부
 * @returns {Object} returns.settings - 알림 설정 (pushEnabled 등)
 * @returns {Function} returns.handleNotificationPress - 알림 탭 핸들러
 *
 * @description
 * 푸시 알림 전체 라이프사이클을 관리합니다.
 * - 자동 초기화 (로그인 시)
 * - Foreground 알림 수신 처리
 * - Background 알림 상호작용 처리
 * - 알림 타입별 네비게이션 라우팅
 * - 프리미엄 사용자 전용 알림 처리
 *
 * @example
 * ```tsx
 * const { isInitialized, settings, handleNotificationPress } = useNotifications();
 *
 * if (isInitialized && settings.pushEnabled) {
 *   // 알림 기능 사용 가능
 * }
 *
 * // 수동 알림 처리
 * handleNotificationPress({
 *   type: 'new_message',
 *   messageId: '123',
 *   roomId: 'room-456'
 * });
 * ```
 */
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

  /**
   * 알림 프레스 핸들러
   *
   * @param {Object} data - 알림 데이터
   * @param {string} data.type - 알림 타입 ('new_match' | 'new_message' | 'like_received' | 'super_like' | 'group_invite')
   * @param {string} [data.userId] - 사용자 ID (선택적)
   * @param {string} [data.groupId] - 그룹 ID (선택적)
   * @param {string} [data.matchId] - 매칭 ID (선택적)
   * @param {string} [data.messageId] - 메시지 ID (선택적)
   * @param {string} [data.roomId] - 채팅방 ID (선택적)
   *
   * @description
   * 알림 타입에 따라 적절한 화면으로 네비게이션합니다.
   * - new_match: 매칭 화면
   * - new_message: 채팅 화면
   * - like_received: 매칭 화면 (프리미엄 전용)
   * - super_like: 매칭 화면
   * - group_invite: 그룹 화면
   */
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