import 'dotenv/config';

// 환경 변수 로드를 위해 상위 디렉토리의 config 시스템 사용
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// API 설정
const getApiConfig = () => {
  if (isDevelopment) {
    return {
      baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1',
      websocketURL: process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001',
    };
  }
  
  if (isProduction) {
    return {
      baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.glimpse.app/api/v1',
      websocketURL: process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'wss://api.glimpse.app',
    };
  }
  
  // 기본값 (staging)
  return {
    baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api-staging.glimpse.app/api/v1',
    websocketURL: process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'wss://api-staging.glimpse.app',
  };
};

const apiConfig = getApiConfig();

export default {
  expo: {
    name: 'Glimpse',
    slug: 'glimpse-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    assetBundlePatterns: ['**/*'],
    
    // iOS 설정
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.glimpse.app',
      infoPlist: {
        NSCameraUsageDescription: '프로필 사진과 스토리를 위해 카메라 접근이 필요합니다.',
        NSPhotoLibraryUsageDescription: '사진을 업로드하기 위해 갤러리 접근이 필요합니다.',
        NSLocationWhenInUseUsageDescription: '근처 그룹과 사용자를 찾기 위해 위치 정보가 필요합니다.',
        NSMicrophoneUsageDescription: '통화 기능을 위해 마이크 접근이 필요합니다.',
      },
    },
    
    // Android 설정
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.glimpse.app',
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'RECORD_AUDIO',
        'READ_CONTACTS',
      ],
    },
    
    // 웹 설정
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    
    // 플러그인 (개발 중 필요한 것만)
    plugins: [
      // 'expo-barcode-scanner', // 패키지 확인 후 활성화
      // 'expo-notifications',   // 패키지 확인 후 활성화
      // 'expo-location',        // 패키지 확인 후 활성화
      // 'expo-camera',          // 패키지 설치 후 활성화
      // 'expo-av',              // 패키지 확인 후 활성화
    ],
    
    // 환경별 설정
    extra: {
      // Expo에서 접근 가능한 환경 변수들
      apiBaseUrl: apiConfig.baseURL,
      websocketUrl: apiConfig.websocketURL,
      environment: process.env.NODE_ENV || 'development',
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      
      // 기능 플래그
      enableAnalytics: isProduction,
      enableDebugMode: isDevelopment,
      enableDevAuth: process.env.EXPO_PUBLIC_DEV_AUTH === 'true',
      
      eas: {
        projectId: process.env.EXPO_PROJECT_ID || 'your-project-id-here',
      },
    },
    
    // EAS 빌드 설정
    updates: {
      fallbackToCacheTimeout: 0,
    },
    
    // 실험적 기능
    experiments: {
      typedRoutes: true,
    },
    
    // New Architecture 설정 (Expo Go와 호환성을 위해 명시적으로 활성화)
    newArchEnabled: true,
  },
};