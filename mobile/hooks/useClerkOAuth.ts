import { useOAuth as useClerkOAuth } from '@clerk/clerk-expo';
import { Platform } from 'react-native';
import { useCallback } from 'react';

/**
 * Custom hook for Clerk OAuth with proper localhost development support
 */
export const useOAuth = () => {
  // Get the base OAuth hook from Clerk
  const { startOAuthFlow: clerkStartOAuthFlow } = useClerkOAuth({
    strategy: 'oauth_google',
  });

  /**
   * Enhanced OAuth flow that handles development environment issues
   */
  const startOAuthFlow = useCallback(async () => {
    try {
      console.log('🚀 Starting enhanced OAuth flow');
      
      // For web platform, we need to handle the redirect URL properly
      if (Platform.OS === 'web') {
        // Store the current URL to return to after OAuth
        const returnUrl = window.location.href;
        sessionStorage.setItem('oauth_return_url', returnUrl);
        
        console.log('📍 Stored return URL:', returnUrl);
      }
      
      // Start the Clerk OAuth flow
      const result = await clerkStartOAuthFlow();
      
      // Log the result for debugging
      console.log('📊 Clerk OAuth result:', {
        hasSessionId: !!result?.createdSessionId,
        hasSignIn: !!result?.signIn,
        hasSignUp: !!result?.signUp,
        hasSetActive: !!result?.setActive,
      });
      
      // Handle the OAuth result
      if (result?.createdSessionId) {
        console.log('✅ Session created successfully');
        
        // If we have a session, ensure it's activated
        if (result.setActive) {
          try {
            await result.setActive({ session: result.createdSessionId });
            console.log('✅ Session activated');
          } catch (error) {
            console.error('❌ Failed to activate session:', error);
          }
        }
      } else if (result?.signIn || result?.signUp) {
        // Sometimes the session isn't immediately created but we have sign in/up data
        console.log('⚠️ Have auth data but no session ID yet');
        
        // Try to get the session from the sign in/up object
        const authObject = result.signIn || result.signUp;
        if (authObject?.createdSessionId) {
          console.log('📝 Found session ID in auth object');
          result.createdSessionId = authObject.createdSessionId;
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ OAuth flow error:', error);
      
      // Check if it's a Cloudflare/CORS issue
      if (error?.message?.includes('401') || error?.message?.includes('Cloudflare')) {
        console.error('🔒 Cloudflare protection detected. This is a known issue with Clerk development instances.');
        console.log('💡 Possible solutions:');
        console.log('1. Configure OAuth redirect URLs in Clerk Dashboard');
        console.log('2. Use a production Clerk instance');
        console.log('3. Use ngrok or similar tunneling service');
      }
      
      throw error;
    }
  }, [clerkStartOAuthFlow]);

  return {
    startOAuthFlow,
  };
};