/**
 * 앱 설정
 * @description 공개 가능한 앱 설정 및 기능 플래그
 */

export const appConfig = {
  // 앱 정보
  appName: 'Glimpse',
  appVersion: '1.0.0',
  
  // 기능 플래그
  features: {
    development: {
      devAuth: true,
      mockData: true,
      debugMode: true,
      hotReload: true,
      analytics: false,
    },
    
    test: {
      devAuth: true,
      mockData: true,
      debugMode: true,
      hotReload: false,
      analytics: false,
    },
    
    staging: {
      devAuth: false,
      mockData: false,
      debugMode: true,
      hotReload: false,
      analytics: true,
    },
    
    production: {
      devAuth: false,
      mockData: false,
      debugMode: false,
      hotReload: false,
      analytics: true,
    },
  },
  
  // 비즈니스 설정
  business: {
    // 좋아요 제한
    dailyFreeLikes: 1,
    cooldownPeriod: 14, // days
    
    // 결제 설정
    pricing: {
      creditPackages: [
        { count: 5, price: 2500 },
        { count: 10, price: 4500 },
        { count: 25, price: 10000 },
        { count: 50, price: 19000 },
      ],
      premium: {
        monthly: 9900,
        yearly: 99000,
      },
    },
    
    // 그룹 설정
    maxGroupMembers: 500,
    minGroupMembers: 10,
    maxUserGroups: 20,
  },
  
  // 파일 업로드 설정
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  
  // 보안 설정 (공개 가능한 것만)
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 900, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    rateLimits: {
      api: { windowMs: 15 * 60 * 1000, max: 100 }, // 15분에 100개
      auth: { windowMs: 15 * 60 * 1000, max: 5 },  // 15분에 5개
    },
  },
};

// 현재 환경 설정 가져오기
export const getCurrentAppConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return {
    ...appConfig,
    currentFeatures: appConfig.features[env] || appConfig.features.development,
  };
};

export default getCurrentAppConfig();