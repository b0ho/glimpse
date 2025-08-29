/**
 * 온보딩 상태 초기화 스크립트
 * React Native 앱에서 실행하여 온보딩을 다시 볼 수 있게 함
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem('@glimpse_onboarding_completed');
    console.log('✅ 온보딩 상태가 초기화되었습니다. 앱을 재시작하면 온보딩을 다시 볼 수 있습니다.');
  } catch (error) {
    console.error('❌ 온보딩 상태 초기화 실패:', error);
  }
};

// React Native Debugger 콘솔에서 실행
// resetOnboarding();

export default resetOnboarding;