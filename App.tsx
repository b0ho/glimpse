import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import { CLERK_CONFIG } from '@/services/auth/clerk-config';
import RootNavigator from '@/navigation/AppNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function GlimpseApp() {
  return (
    <ErrorBoundary>
      <RootNavigator />
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ClerkProvider 
      publishableKey={CLERK_CONFIG.publishableKey}
      tokenCache={CLERK_CONFIG.tokenCache}
    >
      <GlimpseApp />
    </ClerkProvider>
  );
}

