const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve platform-specific dependencies for web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Mock native modules for web platform
  if (platform === 'web') {
    // Mock Stripe React Native for web
    if (moduleName === '@stripe/stripe-react-native') {
      return {
        filePath: path.resolve(__dirname, './utils/mocks/stripe-web-mock.js'),
        type: 'sourceFile',
      };
    }
    
    // Mock react-native-webrtc for web
    if (moduleName === 'react-native-webrtc') {
      return {
        filePath: path.resolve(__dirname, './utils/mocks/webrtc-web-mock.js'),
        type: 'sourceFile',
      };
    }
    
    // Mock react-native-encrypted-storage for web
    if (moduleName === 'react-native-encrypted-storage') {
      return {
        filePath: path.resolve(__dirname, './utils/mocks/encrypted-storage-web-mock.js'),
        type: 'sourceFile',
      };
    }
  }
  
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;