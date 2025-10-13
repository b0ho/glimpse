/**
 * Babel 트랜스파일러 설정
 * @module babel.config
 * @description React Native 및 Expo를 위한 Babel 설정
 */

const nativeWindPlugins = require('./babel-nativewind-wrapper');

module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Spread the NativeWind plugins instead of using them directly
      ...nativeWindPlugins,
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
            '@/lib': './lib',
            '@/types': './types',
            '@/hooks': './hooks',
            '@/navigation': './navigation',
            '@/config': './config',
            '@/providers': './providers',
            '@shared': '../shared',
          },
        },
      ],
    ],
  };
};