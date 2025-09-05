/**
 * Auth store hydration hook
 * @description Waits for Zustand auth store to hydrate from storage
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';

/**
 * Hook to check if auth store has been hydrated from storage
 * @returns {boolean} Whether auth store has been hydrated
 */
export const useAuthHydration = (): boolean => {
  const [hasHydrated, setHasHydrated] = useState(false);
  
  useEffect(() => {
    // Check if the persist API is available
    const authStorePersist = (useAuthStore as any).persist;
    
    if (authStorePersist) {
      // Set initial hydration state
      setHasHydrated(authStorePersist.hasHydrated());
      
      // Subscribe to hydration completion
      const unsubFinishHydration = authStorePersist.onFinishHydration(() => {
        setHasHydrated(true);
      });
      
      return () => {
        unsubFinishHydration();
      };
    } else {
      // If no persist API, consider it hydrated immediately
      setHasHydrated(true);
    }
  }, []);
  
  return hasHydrated;
};