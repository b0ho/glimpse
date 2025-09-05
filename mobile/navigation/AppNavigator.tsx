/**
 * 앱 네비게이터 - 모듈화된 버전
 */

import React, { useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationService } from '@/services/navigation/navigationService';
import { initializeFCM, cleanupFCM } from '@/services/notifications/initializeFCM';
import { useAuthStore } from '@/store/slices/authSlice';
import { setAuthToken } from '@/services/api/config';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useAuthHydration } from '@/hooks/useAuthHydration';

// Screens
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { AuthScreen } from '@/screens/auth/AuthScreen';
import { ModeSelectionScreen } from '@/screens/ModeSelectionScreen';
import { NearbyGroupsScreen } from '@/screens/NearbyGroupsScreen';

// Navigators
import { MainTabNavigator } from './MainTabNavigator';

// Types
type AppStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  ModeSelection: undefined;
  Main: undefined;
  NearbyGroups: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();

/**
 * 인증 화면 래퍼
 */
const AuthScreenWrapper = () => {
  const handleAuthCompleted = () => {
    console.log('Auth completed');
  };
  
  return <AuthScreen onAuthCompleted={handleAuthCompleted} />;
};

/**
 * 앱 네비게이터 컴포넌트
 */
export const AppNavigator = () => {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const { isAuthenticated } = useAuth();
  const { user, token } = useAuthStore();
  const { isDarkMode } = useTheme();
  const hasAuthHydrated = useAuthHydration();
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  
  /**
   * 온보딩 및 인증 상태 확인
   */
  useEffect(() => {
    checkInitialState();
  }, []);
  
  const checkInitialState = async () => {
    try {
      // 온보딩 상태 확인
      const completed = await AsyncStorage.getItem('@glimpse_onboarding_completed');
      setIsOnboardingCompleted(completed === 'true');
    } catch (error) {
      console.error('Failed to check initial state:', error);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };
  
  /**
   * 네비게이션 서비스 초기화
   */
  useEffect(() => {
    if (navigationRef.current) {
      navigationService.setNavigator(navigationRef.current);
    }
  }, []);
  
  /**
   * FCM 초기화
   */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupFCM = async () => {
      if (Platform.OS !== 'web' && isAuthenticated) {
        unsubscribe = await initializeFCM();
      }
    };
    
    setupFCM();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      cleanupFCM();
    };
  }, [isAuthenticated]);
  
  /**
   * 인증 토큰 설정
   */
  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);
  
  /**
   * 초기 화면 결정
   */
  const getInitialRouteName = (): keyof AppStackParamList => {
    if (isCheckingOnboarding || !hasAuthHydrated) {
      return 'Onboarding'; // 로딩 중에는 온보딩을 표시
    }
    
    if (!isOnboardingCompleted) {
      return 'Onboarding';
    }
    
    if (!isAuthenticated || !user) {
      return 'Auth';
    }
    
    return 'Main';
  };
  
  /**
   * 온보딩 완료 핸들러
   */
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('@glimpse_onboarding_completed', 'true');
      setIsOnboardingCompleted(true);
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
  };
  
  /**
   * 모드 선택 완료 핸들러
   */
  const handleModeSelected = () => {
    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };
  
  if (isCheckingOnboarding || !hasAuthHydrated) {
    return null;
  }
  
  return (
    <NavigationContainer 
      ref={navigationRef}
      theme={isDarkMode ? DarkTheme : DefaultTheme}
    >
      <Stack.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{
            headerShown: false,
          }}
          initialParams={{ onComplete: handleOnboardingComplete }}
        />
        
        <Stack.Screen 
          name="Auth" 
          component={AuthScreenWrapper}
        />
        
        <Stack.Screen 
          name="ModeSelection" 
          component={ModeSelectionScreen}
          options={{
            gestureEnabled: false,
          }}
          initialParams={{ onModeSelected: handleModeSelected }}
        />
        
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
        
        <Stack.Screen 
          name="NearbyGroups" 
          component={NearbyGroupsScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};