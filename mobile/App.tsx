import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import AppNavigator from './navigation/AppNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CallProvider } from './providers/CallProvider';
import { DevModePanel } from './components/DevModePanel';
import { isAuthBypassEnabled } from './config/dev.config';

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
  // Clerk publishable key - 실제 환경에서는 환경 변수로 관리
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_xxx';
  
  // 테스트를 위해 Clerk 없이 실행
  const AppContent = () => (
    <SafeAreaProvider>
      <CallProvider>
        <StatusBar style="auto" />
        <AppNavigator />
        {isAuthBypassEnabled && <DevModePanel />}
      </CallProvider>
    </SafeAreaProvider>
  );

  // Clerk 키가 유효하지 않거나 개발 모드 인증 우회가 활성화된 경우
  if (isAuthBypassEnabled || clerkPublishableKey === 'pk_test_xxx') {
    return (
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        <AppContent />
      </ClerkProvider>
    </ErrorBoundary>
  );
}