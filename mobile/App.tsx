import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import AppNavigator from './navigation/AppNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CallProvider } from './providers/CallProvider';

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

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        <SafeAreaProvider>
          <CallProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </CallProvider>
        </SafeAreaProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}