import React, { useEffect } from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { CLERK_CONFIG } from '@/services/auth/clerk-config';
import RootNavigator from '@/navigation/AppNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useNotifications } from '@/hooks/useNotifications';
import { initializeSentry } from '@/services/sentry/sentry-config';

// Initialize Sentry
initializeSentry();

function GlimpseApp() {
  // Initialize notifications
  useNotifications();

  useEffect(() => {
    // Handle app state changes for background notification management
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed to:', nextAppState);
      
      // You can add logic here to handle background/foreground transitions
      // For example, refreshing notification permissions or clearing notification badges
      if (nextAppState === 'active') {
        // App has come to foreground
        console.log('App is now active');
      } else if (nextAppState === 'background') {
        // App has gone to background
        console.log('App is now in background');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <RootNavigator />
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ClerkProvider 
      publishableKey={CLERK_CONFIG.publishableKey}
      tokenCache={CLERK_CONFIG.tokenCache}
    >
      <GlimpseApp />
    </ClerkProvider>
  );
}

// Wrap the app with Sentry
export default Sentry.wrap(App);

