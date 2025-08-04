/**
 * Babel 트랜스파일러 설정
 * @module babel.config
 * @description React Native 및 Expo를 위한 Babel 설정
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/components': './components',
            '@/screens': './screens',
            '@/services': './services',
            '@/store': './store',
            '@/utils': './utils',
            '@/types': './types',
            '@/hooks': './hooks',
            '@/navigation': './navigation',
          },
        },
      ],
    ],
  };
};