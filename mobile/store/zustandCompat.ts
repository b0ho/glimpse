/**
 * Zustand CommonJS compatibility layer
 * 
 * This module provides CommonJS versions of zustand to avoid ESM/import.meta
 * conflicts that cause issues with web bundling in React Native.
 * 
 * NativeWind v4 and web bundling can have issues with ESM modules that use
 * import.meta, so we explicitly use the CommonJS versions here.
 */

// Use require to force CommonJS versions
const zustandCore = require('zustand');
const zustandMiddleware = require('zustand/middleware');

// Re-export the commonly used functions
export const create = zustandCore.create || zustandCore.default?.create || zustandCore;
export const persist = zustandMiddleware.persist;
export const createJSONStorage = zustandMiddleware.createJSONStorage;
export const devtools = zustandMiddleware.devtools;
export const subscribeWithSelector = zustandMiddleware.subscribeWithSelector;

// Export default for backward compatibility
export default {
  create,
  persist,
  createJSONStorage,
  devtools,
  subscribeWithSelector
};