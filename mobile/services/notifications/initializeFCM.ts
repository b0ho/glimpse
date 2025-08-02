import { fcmService } from './fcmService';
import { useAuthStore } from '@/store/slices/authSlice';

/**
 * FCM 초기화
 * @async
 * @function initializeFCM
 * @returns {Promise<void>}
 * @description 사용자가 인증되었을 때 FCM을 초기화하고 푸시 알림 등록
 */
export const initializeFCM = async () => {
  const authState = useAuthStore.getState();
  
  if (authState.isAuthenticated && authState.user) {
    console.log('Initializing FCM for user:', authState.user.id);
    await fcmService.initialize();
  }
};

/**
 * FCM 정리
 * @async
 * @function cleanupFCM
 * @returns {Promise<void>}
 * @description 로그아웃 시 FCM 토큰 제거 및 정리 작업 수행
 */
export const cleanupFCM = async () => {
  console.log('Cleaning up FCM...');
  await fcmService.removeToken();
};