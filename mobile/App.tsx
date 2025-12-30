import './global.css';
import 'react-native-css-interop';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, ActivityIndicator, View } from 'react-native';
import RootNavigator from './navigation/AppNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initI18n, ensureI18nReady } from './services/i18n/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './services/i18n/i18n';
import { useTheme } from './hooks/useTheme';
import Toast from 'react-native-toast-message';
import { AuthProvider, AuthLoaded } from './providers/AuthProvider';

// SafeAreaProvider는 네이티브 플랫폼에서만 필요
let SafeAreaProvider: React.ComponentType<{ children: React.ReactNode }>;
if (Platform.OS !== 'web') {
  SafeAreaProvider = require('react-native-safe-area-context').SafeAreaProvider;
} else {
  // 웹에서는 단순 wrapper 사용
  SafeAreaProvider = ({ children }) => <>{children}</>;
}

/**
 * Glimpse 앱 메인 컴포넌트
 * 
 * 자체 JWT 인증 시스템을 사용합니다.
 */
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

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthLoaded>
          <AppContent />
        </AuthLoaded>
      </AuthProvider>
    </ErrorBoundary>
  );
}

/**
 * 앱 콘텐츠 컴포넌트
 */
const AppContent: React.FC = () => {
  const { isDark, colors } = useTheme();
  
  // NativeWind 다크모드 클래스 동적 적용 (모든 플랫폼에서 일관되게)
  useEffect(() => {
    // Web 환경에서만 document가 존재하지만, 
    // 이는 기술적 제약이며 기능적 차이가 아님
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
    // Native 환경에서는 NativeWind가 자동으로 처리하므로
    // 별도 작업 불필요 (기술적 차이일 뿐, 기능은 동일)
  }, [isDark]);
  
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
