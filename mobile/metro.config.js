const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve platform-specific dependencies for web
config.resolver.platforms = ['web', 'ios', 'android', 'ts', 'tsx', 'js', 'jsx'];
config.resolver.alias = {
  ...config.resolver.alias,
  // Mock Stripe for web platform
  '@stripe/stripe-react-native': require.resolve('./mobile/utils/mocks/stripe-web-mock.js'),
};

// For web, resolve native modules to empty mocks
config.resolver.resolverMainFields = ['browser', 'main'];

module.exports = config;