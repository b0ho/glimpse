import './global.css';
import 'react-native-css-interop';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Platform, ActivityIndicator, View, Text } from 'react-native';
import RootNavigator from './navigation/AppNavigator';
import { useAuth } from '@clerk/clerk-expo';
import { setAuthToken } from './services/api/config';
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
  const [mountClerk, setMountClerk] = useState(Platform.OS !== 'web');
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
        
        // i18n 작동 확인
        const testTranslation = i18n.t('navigation:tabs.home');
        console.log('[App] i18n test:', testTranslation);
        
        if (testTranslation === 'navigation:tabs.home' || testTranslation === 'tabs.home') {
          console.warn('[App] i18n not fully ready, waiting more...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('[App] i18n initialized successfully');
        setIsI18nInitialized(true);
      } catch (error) {
        console.error('[App] Failed to initialize i18n:', error);
        
        // 모든 플랫폼에서 동일한 재시도 로직
        if (initAttempts < 5) {
          setInitAttempts(prev => prev + 1);
          setTimeout(() => initializeI18n(), 1000);
        } else {
          // 초기화 실패 시에도 앱 로드 계속
          setIsI18nInitialized(true);
        }
      }
    };
    
    initializeI18n();
  }, [initAttempts]);

  // On web, delay ClerkProvider mount to next tick to avoid context race (#321)
  useEffect(() => {
    if (Platform.OS === 'web') {
      Promise.resolve().then(() => setMountClerk(true));
    }
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
  let clerkPublishableKey: string;
  let clerkFrontendApi: string | undefined = undefined;
  const devKey = 'pk_test_bGlrZWQtZG9nLTkzLmNsZXJrLmFjY291bnRzLmRldiQ';
  
  // 환경별 Clerk 설정
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  
  if (typeof window !== 'undefined') {
    const hostname = window.location?.hostname || '';
    
    // 환경 변수 디버깅 정보 출력
    console.log('=== Clerk Configuration Debug v3 - Build: ' + Date.now() + ' ===');
    console.log('Hostname:', hostname);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('__DEV__:', __DEV__);
    console.log('ENV vars available:', Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC_')));
    console.log('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY exists:', !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);
    console.log('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY value:', process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 30) + '...');
    console.log('=================================');
    
    // 로컬 개발 환경 체크
    const isLocalhost = hostname === 'localhost' || 
                       hostname.includes('127.0.0.1') || 
                       hostname.includes('192.168') || 
                       hostname.includes('172.') ||
                       hostname.includes('10.');
    
    // Vercel 도메인 체크 (임시 - Clerk Dashboard에서 도메인 추가 전까지)
    const isVercelDomain = hostname.includes('vercel.app');
    
    // glimpse.contact 도메인 체크 - 운영 도메인
    const isGlimpseContact = hostname.includes('glimpse.contact');
    
    // 로컬 개발 환경 또는 Vercel 임시 도메인
    if (isLocalhost || isVercelDomain) {
      // 로컬과 Vercel 임시 도메인에서는 개발 키 사용
      clerkPublishableKey = devKey;
      clerkFrontendApi = undefined; // 개발 키는 커스텀 도메인 불필요
      
      if (isVercelDomain) {
        console.log('⚠️ Using development Clerk key for Vercel domain (temporary)');
      } else {
        console.log('🔧 Using development Clerk key for local environment');
      }
    } 
    // 운영 환경 (glimpse.contact 및 기타 프로덕션 도메인)
    else {
      // 운영 환경에서는 환경 변수 사용
      const prodKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
      
      // 여러 방법으로 환경 변수 확인
      const alternativeKey = (typeof globalThis !== 'undefined' && (globalThis as any).EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) ||
                            (typeof window !== 'undefined' && (window as any).EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);
      
      const finalProdKey = prodKey || alternativeKey;
      
      if (finalProdKey && finalProdKey !== '' && finalProdKey !== 'undefined' && finalProdKey !== devKey) {
        clerkPublishableKey = finalProdKey;
        console.log('🚀 Using production Clerk key for production environment');
        console.log('Production domain:', hostname);
        console.log('Production key found:', finalProdKey.substring(0, 20) + '...');
      } else {
        // glimpse.contact에서는 특별 처리
        if (isGlimpseContact) {
          console.error('🚨 CRITICAL: Production key not found for glimpse.contact!');
          console.error('Environment variables:', {
            'process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
            'window.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY': (window as any).EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
            'All EXPO_PUBLIC vars': Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC_'))
          });
          
          // glimpse.contact는 프로덕션이므로 개발 키 사용을 피하고 싶지만,
          // 키가 없으면 앱이 작동하지 않으므로 폴백
          console.warn('⚠️ FALLBACK: Using development key for glimpse.contact (not ideal!)');
          clerkPublishableKey = devKey;
        } else {
          // 다른 도메인에서는 일반 폴백
          console.warn('⚠️ Production key not found, falling back to dev key');
          clerkPublishableKey = devKey;
        }
      }
      
      if (isGlimpseContact) {
        console.log('✅ glimpse.contact domain detected');
        console.log('Key being used:', clerkPublishableKey === devKey ? 'DEVELOPMENT KEY (FALLBACK)' : 'PRODUCTION KEY');
      }
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
    
    // Clerk hooks를 안전하게 사용
    let isLoaded = false;
    let isSignedIn = false;
    let getToken: (() => Promise<string | null>) | null = null;
    
    try {
      const auth = useAuth();
      isLoaded = auth.isLoaded;
      isSignedIn = auth.isSignedIn;
      getToken = auth.getToken;
    } catch (error) {
      console.log('[AppContent] Clerk not ready yet');
    }
    
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
      const prepareAuth = async () => {
        if (!isLoaded) {
          console.log('[AppContent] Clerk not loaded yet');
          setAuthReady(false);
          return;
        }
        if (!isSignedIn) {
          console.log('[AppContent] User not signed in, clearing token');
          setAuthToken(null);
          setAuthReady(true);
          return;
        }
        
        console.log('[AppContent] User signed in, getting token...');
        // Retry getting token a few times to avoid post-login race
        let token: string | null = null;
        if (getToken) {
          for (let i = 0; i < 5; i++) {
            try {
              token = await getToken();
              if (token) {
                console.log('[AppContent] Token obtained on attempt', i + 1);
                break;
              }
            } catch (error) {
              console.log('[AppContent] Token attempt', i + 1, 'failed:', error);
            }
            await new Promise(r => setTimeout(r, 250));
          }
        }
        
        if (token) {
          console.log('[AppContent] Setting auth token for API client');
          setAuthToken(token);
          setAuthReady(true);
        } else {
          console.error('[AppContent] Failed to get token after 5 attempts');
          // 토큰을 가져올 수 없어도 앱은 로드하되, API 호출은 실패할 것임
          setAuthToken(null);
          setAuthReady(true);
        }
      };
      prepareAuth();
    }, [isLoaded, isSignedIn, getToken]);
    
    return (
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.BACKGROUND} />
          <View style={{ flex: 1, backgroundColor: colors.BACKGROUND }}>
            {!authReady ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.PRIMARY} />
              </View>
            ) : (
              <>
                <RootNavigator />
                <Toast />
              </>
            )}
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
      {mountClerk ? (
        <ClerkProvider {...clerkProviderProps}>
          <ClerkLoaded>
            <AppContent />
          </ClerkLoaded>
        </ClerkProvider>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
          <ActivityIndicator size="large" color="#FF8A8A" />
        </View>
      )}
    </ErrorBoundary>
  );
}