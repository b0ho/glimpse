/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expo web을 Next.js와 통합
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    };
    return config;
  },
  
  // 환경 변수를 클라이언트에 노출
  env: {
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://glimpse-server.up.railway.app/api/v1',
    EXPO_PUBLIC_WEBSOCKET_URL: process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'wss://glimpse-server.up.railway.app',
    NODE_ENV: process.env.NODE_ENV || 'production',
  },
  
  // 정적 내보내기 설정
  output: 'export',
  
  // 이미지 최적화 비활성화 (정적 내보내기와 호환)
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;