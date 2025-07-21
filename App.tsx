import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import { CLERK_CONFIG } from '@/services/auth/clerk-config';
import RootNavigator from '@/navigation/AppNavigator';

function GlimpseApp() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
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

