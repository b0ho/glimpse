import { fcmService } from './fcmService';
import { useAuthStore } from '@/store/slices/authSlice';

/**
 * Initialize FCM when user is authenticated
 */
export const initializeFCM = async () => {
  const authState = useAuthStore.getState();
  
  if (authState.isAuthenticated && authState.user) {
    console.log('Initializing FCM for user:', authState.user.id);
    await fcmService.initialize();
  }
};

/**
 * Clean up FCM on logout
 */
export const cleanupFCM = async () => {
  console.log('Cleaning up FCM...');
  await fcmService.removeToken();
};