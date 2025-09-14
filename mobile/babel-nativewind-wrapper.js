/**
 * Wrapper for NativeWind/react-native-css-interop babel plugin
 * 
 * The react-native-css-interop/babel plugin returns an object with a 'plugins' property,
 * but Babel expects the plugin itself. This wrapper extracts and properly configures
 * the plugins for use in babel.config.js
 */

const cssInteropConfig = require("react-native-css-interop/babel");

// Get the configuration returned by the css-interop babel plugin
const config = cssInteropConfig();

// Export just the plugins array, which will be spread into our babel config
module.exports = config.plugins || [];