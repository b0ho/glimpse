import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import apiClient from '@/services/api/config';
import { AppMode } from '../../shared/types';

/**
 * 프로필 데이터 관리 Hook
 * 사용자 프로필 정보와 관련 기능을 관리
 */
export const useProfileData = (t: (key: string) => string) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const authStore = useAuthStore();
  const likeStore = useLikeStore();
  const groupStore = useGroupStore();
  
  // 개발 환경에서는 authStore.user?.isPremium을 직접 사용
  const isPremiumUser = __DEV__ 
    ? authStore.user?.isPremium || false 
    : usePremiumStore(premiumSelectors.isPremiumUser());
  const currentPlan = usePremiumStore(premiumSelectors.getCurrentPlan());
  const currentMode = authStore.currentMode || AppMode.DATING;

  /**
   * 최신 프로필 정보 가져오기
   */
  const fetchLatestProfile = async () => {
    try {
      const currentUser = authStore.user;
      if (!currentUser?.id) {
        console.warn('No user ID available for profile fetch');
        return;
      }

      const response = await apiClient.get<{ success: boolean; data: any }>(`/users/profile?userId=${currentUser.id}`);
      if (response.success && response.data) {
        authStore.updateUserProfile({
          ...currentUser,
          nickname: response.data.nickname,
          bio: response.data.bio,
          profileImage: response.data.profileImage,
          isPremium: response.data.isPremium,
          credits: response.data.credits,
        });
      }
    } catch (error) {
      console.error('Failed to fetch latest profile:', error);
    }
  };

  /**
   * 화면이 포커스될 때마다 최신 프로필 가져오기
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchLatestProfile);
    return unsubscribe;
  }, [navigation]);

  /**
   * 로그아웃 핸들러
   */
  const handleSignOut = async () => {
    // 웹 환경과 네이티브 환경 구분 처리
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('profile:settings.logoutConfirm'));
      if (!confirmed) return;
      
      setIsLoggingOut(true);
      try {
        console.log('[Logout] Starting logout process...');
        
        // 스토어 초기화를 먼저 수행 (clearAuth는 이제 async)
        await authStore.clearAuth();
        likeStore.clearLikes();
        groupStore.clearGroups();
        
        console.log('[Logout] Stores cleared, user:', authStore.user);
        
        // Clerk/DevAuth 로그아웃 수행
        await signOut();
        
        console.log('[Logout] SignOut completed, navigating to Auth...');
        
        // 네비게이션을 Auth 화면으로 리셋
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
        
        console.log('[Logout] Navigation reset completed');
      } catch (error) {
        console.error('Sign out error:', error);
        window.alert(t('profile:settings.logoutError'));
      } finally {
        setIsLoggingOut(false);
      }
    } else {
      Alert.alert(
        t('profile:settings.logout'),
        t('profile:settings.logoutConfirm'),
        [
          { text: t('common:buttons.cancel'), style: 'cancel' },
          {
            text: t('profile:settings.logout'),
            style: 'destructive',
            onPress: async () => {
              setIsLoggingOut(true);
              try {
                console.log('[Logout] Starting logout process (Native)...');
                
                // 스토어 초기화를 먼저 수행 (clearAuth는 이제 async)
                await authStore.clearAuth();
                likeStore.clearLikes();
                groupStore.clearGroups();
                
                console.log('[Logout] Stores cleared (Native), user:', authStore.user);
                
                // Clerk/DevAuth 로그아웃 수행
                await signOut();
                
                // 네비게이션을 Auth 화면으로 리셋
                (navigation as any).reset({
                  index: 0,
                  routes: [{ name: 'Auth' }],
                });
              } catch (error) {
                console.error('Sign out error:', error);
                Alert.alert(t('common:status.error'), t('profile:settings.logoutError'));
              } finally {
                setIsLoggingOut(false);
              }
            },
          },
        ]
      );
    }
  };

  /**
   * 닉네임 편집 핸들러
   */
  const handleEditNickname = () => {
    navigation.navigate('ProfileEdit' as never);
  };

  /**
   * 계정 삭제 핸들러
   */
  const handleDeleteAccount = () => {
    navigation.navigate('DeleteAccount' as never);
  };

  return {
    // User data
    user: authStore.user,
    isPremiumUser,
    currentPlan,
    currentMode,
    
    // Statistics
    joinedGroupsCount: groupStore.joinedGroups.length,
    sentLikesCount: likeStore.sentLikes.length,
    receivedLikesCount: likeStore.getReceivedLikesCount(),
    matchesCount: likeStore.matches.length,
    
    // Like system
    remainingFreeLikes: likeStore.getRemainingFreeLikes(),
    premiumLikesRemaining: likeStore.premiumLikesRemaining,
    remainingSuperLikes: likeStore.getRemainingSuperLikes(),
    dailySuperLikesLimit: likeStore.dailySuperLikesLimit,
    canRewindLike: likeStore.canRewindLike(),
    
    // Actions
    handleSignOut,
    handleEditNickname,
    handleDeleteAccount,
    fetchLatestProfile,
    
    // Loading states
    isLoggingOut,
  };
};