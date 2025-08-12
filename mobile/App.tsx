import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import { Platform, ActivityIndicator, View } from 'react-native';
import RootNavigator from './navigation/AppNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DevModePanel } from './components/DevModePanel';
import { CallProvider } from './providers/CallProvider';
import { isAuthBypassEnabled } from './config/dev.config';
import { initI18n } from './services/i18n/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './services/i18n/i18n';

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
    console.log('Dev mode auth bypass:', isAuthBypassEnabled);
  }

  // Show loading screen while i18n is initializing
  if (!isI18nInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Clerk publishable key - 실제 환경에서는 환경 변수로 관리
  const clerkPublishableKey = 'pk_test_xxx';
  
  // 앱 컨텐츠
  const AppContent = () => (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <CallProvider>
          <RootNavigator />
          {isAuthBypassEnabled && Platform.OS !== 'web' && <DevModePanel />}
        </CallProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );

  // Clerk 키가 유효하지 않거나 개발 모드 인증 우회가 활성화된 경우
  if (isAuthBypassEnabled || clerkPublishableKey === 'pk_test_xxx' || Platform.OS === 'web') {
    return (
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider 
        publishableKey={clerkPublishableKey!} 
        tokenCache={tokenCache}
      >
        <AppContent />
      </ClerkProvider>
    </ErrorBoundary>
  );
}