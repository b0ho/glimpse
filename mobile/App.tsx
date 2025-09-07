import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider } from '@clerk/clerk-expo';
import { Platform, ActivityIndicator, View, Text } from 'react-native';
import { AppNavigator as RootNavigator } from './navigation/AppNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initI18n, ensureI18nReady } from './services/i18n/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './services/i18n/i18n';
import { useIsDark, useColors } from './hooks/useTheme';
import Toast from 'react-native-toast-message';

// SafeAreaProvider는 네이티브 플랫폼에서만 필요
let SafeAreaProvider: any;
if (Platform.OS !== 'web') {
  SafeAreaProvider = require('react-native-safe-area-context').SafeAreaProvider;
} else {
  // 웹에서는 단순 wrapper 사용
  SafeAreaProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
}

// SecureStore polyfill for web
let SecureStore: any;
if (Platform.OS === 'web') {
  // 웹 환경에서는 localStorage 사용
  SecureStore = {
    getItemAsync: async (key: string) => {
      try {
        return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
      } catch (err) {
        console.warn('SecureStore.getItemAsync error:', err);
        return null;
      }
    },
    setItemAsync: async (key: string, value: string) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (err) {
        console.warn('SecureStore.setItemAsync error:', err);
      }
    },
    deleteItemAsync: async (key: string) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (err) {
        console.warn('SecureStore.deleteItemAsync error:', err);
      }
    }
  };
} else {
  SecureStore = require('expo-secure-store');
}

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
  async deleteToken(key: string) {
    try {
      return SecureStore.deleteItemAsync(key);
    } catch (err) {
      return;
    }
  },
};

export default function App() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);

  useEffect(() => {
    // 모든 플랫폼에서 동일한 i18n 초기화
    const initializeI18n = async () => {
      try {
        console.log(`[App] Initializing i18n... (Platform: ${Platform.OS})`);
        
        // 모든 플랫폼에서 동일한 초기화 로직
        await initI18n();
        
        // 모든 플랫폼에서 i18n 준비 확인
        await ensureI18nReady();
        
        // 번역 로딩을 위한 일관된 대기 시간
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 테스트 번역 확인
        const testTranslation = i18n.t('navigation:tabs.home');
        console.log('[App] i18n test:', testTranslation);
        
        if (testTranslation && testTranslation !== 'navigation:tabs.home') {
          console.log('[App] i18n initialized successfully');
          setIsI18nInitialized(true);
        } else {
          console.warn('[App] i18n initialization incomplete, retrying...');
          throw new Error('i18n not ready');
        }
      } catch (error) {
        console.error('[App] i18n initialization error:', error);
        // 재시도 로직
        if (initAttempts < 3) {
          console.log(`[App] Retrying i18n initialization (attempt ${initAttempts + 1}/3)`);
          setTimeout(() => {
            setInitAttempts(prev => prev + 1);
          }, 1000);
        } else {
          console.warn('[App] Max i18n initialization attempts reached, continuing anyway');
          // 초기화 실패 시에도 앱 로드 계속
          setIsI18nInitialized(true);
        }
      }
    };
    
    initializeI18n();
  }, [initAttempts]);

  // 웹 환경 체크
  if (Platform.OS === 'web') {
    console.log('Glimpse app is running on web');
  }

  // Show loading screen while i18n is initializing
  if (!isI18nInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#FF8A8A" />
      </View>
    );
  }

  // Clerk publishable key - 환경에 따라 적절한 키 선택
  let clerkPublishableKey: string;
  let clerkFrontendApi: string | undefined = undefined;
  const devKey = 'pk_test_bGlrZWQtZG9nLTkzLmNsZXJrLmFjY291bnRzLmRldiQ';
  
  // 환경별 Clerk 설정
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  
  if (typeof window !== 'undefined') {
    const hostname = window.location?.hostname || '';
    
    // 로컬 개발 환경 체크
    const isLocalhost = hostname === 'localhost' || 
                       hostname.includes('127.0.0.1') || 
                       hostname.includes('192.168') || 
                       hostname.includes('172.') ||
                       hostname.includes('10.');
    
    // Vercel 도메인 체크 (임시 - Clerk Dashboard에서 도메인 추가 전까지)
    const isVercelDomain = hostname.includes('vercel.app');
    
    // 운영 도메인 체크 (glimpse.contact 및 www.glimpse.contact)
    const isProductionDomain = hostname === 'glimpse.contact' || 
                               hostname === 'www.glimpse.contact' ||
                               hostname.endsWith('.glimpse.contact');
    
    // 로컬 개발 환경 또는 Vercel 도메인
    if (isLocalhost || isVercelDomain) {
      // 로컬과 Vercel에서는 개발 키 사용
      clerkPublishableKey = devKey;
      clerkFrontendApi = undefined; // 개발 키는 커스텀 도메인 불필요
      
      if (isVercelDomain) {
        console.log('⚠️ Using development Clerk key for Vercel domain (temporary)');
      } else {
        console.log('🔧 Using development Clerk key for local environment');
      }
    } 
    // 운영 환경 (glimpse.contact, www.glimpse.contact 등)
    else if (isProductionDomain) {
      // 운영 도메인에서는 반드시 프로덕션 키 사용
      clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || devKey;
      console.log('🚀 Using production Clerk key for production domain:', hostname);
      console.log('Production key:', clerkPublishableKey.substring(0, 20) + '...');
      
      // 프로덕션 키가 없으면 경고
      if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        console.error('⚠️ WARNING: Production Clerk key not found in environment variables!');
      }
    }
    // 기타 도메인
    else {
      // 알 수 없는 도메인에서는 환경 변수 사용 (개발 키 폴백)
      clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || devKey;
      console.log('🔍 Unknown domain, using environment variable or dev key:', hostname);
    }
  } else {
    // 모바일 앱 환경
    if (isDevelopment) {
      // 개발 환경
      clerkPublishableKey = devKey;
      console.log('📱 Using development Clerk key for mobile development');
    } else {
      // 운영 환경 - 환경 변수 사용
      clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || devKey;
      console.log('📱 Using production Clerk key for mobile production');
    }
    clerkFrontendApi = undefined;
  }
  
  // 앱 컨텐츠
  const AppContent = () => {
    const isDark = useIsDark();
    const colors = useColors();
    
    return (
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.BACKGROUND} />
          <View style={{ flex: 1, backgroundColor: colors.BACKGROUND }}>
            <RootNavigator />
            <Toast />
          </View>
        </SafeAreaProvider>
      </I18nextProvider>
    );
  };

  // Clerk 키가 없으면 에러 표시
  if (!clerkPublishableKey) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <Text style={{ color: '#FF8A8A', fontSize: 18, textAlign: 'center', paddingHorizontal: 20 }}>
          Clerk 설정이 필요합니다.{'\n'}
          환경 변수를 확인해주세요.
        </Text>
      </View>
    );
  }

  // CRITICAL FIX: Vercel 도메인에서는 프로덕션 키와 frontendApi 완전 차단
  let isVercelDomain = false;
  if (typeof window !== 'undefined') {
    const hostname = window.location?.hostname || '';
    isVercelDomain = hostname.includes('vercel.app');
    if (isVercelDomain) {
      // Vercel에서는 무조건 개발 키만 사용, 환경변수 완전 무시
      clerkPublishableKey = 'pk_test_bGlrZWQtZG9nLTkzLmNsZXJrLmFjY291bnRzLmRldiQ';
      clerkFrontendApi = undefined;
      console.log('🔧 CRITICAL: Forcing development Clerk key for Vercel deployment');
    }
  }
  
  // ClerkProvider 설정 - Vercel에서는 frontendApi 절대 사용 안함
  const clerkProviderProps: any = {
    publishableKey: clerkPublishableKey,
    tokenCache: tokenCache,
  };
  
  // Vercel이 아닌 경우에만 frontendApi 설정 (glimpse.contact 도메인용)
  if (clerkFrontendApi && !isVercelDomain) {
    clerkProviderProps.frontendApi = clerkFrontendApi;
  }

  return (
    <ErrorBoundary>
      <ClerkProvider {...clerkProviderProps}>
        <AppContent />
      </ClerkProvider>
    </ErrorBoundary>
  );
}