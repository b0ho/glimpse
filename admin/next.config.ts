import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 성능 최적화 설정
  compress: true,
  poweredByHeader: false,
  
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'localhost',
      's3.amazonaws.com',
      // AWS S3 도메인 추가 예정
    ],
  },

  // 웹팩 최적화
  webpack: (config, { dev, isServer }) => {
    // 프로덕션 빌드 시 번들 최적화
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          shadcn: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'shadcn',
            priority: 10,
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },

  // 실험적 기능
  experimental: {
    optimizeCss: false, // critters 모듈 오류 방지
    optimizePackageImports: [
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog', 
      '@radix-ui/react-label',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      'lucide-react',
    ],
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // 정적 자산 캐싱
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },
};

export default nextConfig;
