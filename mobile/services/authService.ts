import { useAuth } from '@clerk/clerk-expo';

// Simple auth service wrapper for token access
export const authService = {
  async getAccessToken(): Promise<string | null> {
    try {
      // In a real app, you would get this from Clerk's getToken method
      // For now, returning null to avoid dependency issues
      return null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  },
};

// Hook-based auth service
export const useAuthService = () => {
  const { getToken } = useAuth();
  
  return {
    async getAccessToken(): Promise<string | null> {
      try {
        const token = await getToken();
        return token;
      } catch (error) {
        console.error('Failed to get access token:', error);
        return null;
      }
    },
  };
};