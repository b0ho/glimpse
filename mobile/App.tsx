import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider } from '@clerk/clerk-expo';
import { Platform, ActivityIndicator, View, Text } from 'react-native';
import RootNavigator from './navigation/AppNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CallProvider } from './providers/CallProvider';
import { initI18n } from './services/i18n/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './services/i18n/i18n';
import { useIsDark, useColors } from './hooks/useTheme';

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

  useEffect(() => {
    // Initialize i18n
    initI18n()
      .then(() => {
        setIsI18nInitialized(true);
      })
      .catch((error) => {
        console.error('Failed to initialize i18n:', error);
        // Even if i18n fails, continue loading the app
        setIsI18nInitialized(true);
      });
  }, []);

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
  let clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  let clerkFrontendApi = process.env.EXPO_PUBLIC_CLERK_FRONTEND_API;
  
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
    
    // 로컬 개발 환경, 개발 모드, 또는 Vercel 도메인
    if (isLocalhost || isDevelopment || isVercelDomain) {
      // 로컬과 Vercel에서는 개발 키 사용
      clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_bGlrZWQtZG9nLTkzLmNsZXJrLmFjY291bnRzLmRldiQ';
      clerkFrontendApi = undefined; // 개발 키는 커스텀 도메인 불필요
      
      if (isVercelDomain) {
        console.log('⚠️ Using development Clerk key for Vercel domain (temporary until domain is added to Clerk Dashboard)');
      } else {
        console.log('🔧 Using development Clerk key for local environment');
      }
    } 
    // 운영 환경 (glimpse.contact)
    else {
      // glimpse.contact에서만 프로덕션 키 사용
      console.log('🚀 Using production Clerk key for production environment (glimpse.contact)');
    }
  } else if (isDevelopment) {
    // 모바일 앱 개발 환경
    clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_bGlrZWQtZG9nLTkzLmNsZXJrLmFjY291bnRzLmRldiQ';
    clerkFrontendApi = undefined;
    console.log('📱 Using development Clerk key for mobile development');
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
            <CallProvider>
              <RootNavigator />
            </CallProvider>
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

  // frontendApi가 설정되어 있으면 사용 (Production 환경)
  const clerkProviderProps: any = {
    publishableKey: clerkPublishableKey,
    tokenCache: tokenCache,
  };
  
  if (clerkFrontendApi) {
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