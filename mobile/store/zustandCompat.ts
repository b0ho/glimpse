/**
 * Zustand CommonJS compatibility layer
 *
 * This module provides CommonJS versions of zustand to avoid ESM/import.meta
 * conflicts that cause issues with web bundling in React Native.
 *
 * NativeWind v4 and web bundling can have issues with ESM modules that use
 * import.meta, so we explicitly use the CommonJS versions here.
 */

// Import types from zustand
import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import type { PersistOptions, StorageValue } from 'zustand/middleware';

// Use require to force CommonJS versions
const zustandCore = require('zustand');
const zustandMiddleware = require('zustand/middleware');

// Type-safe create function
type Create = {
  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => import('zustand').UseBoundStore<import('zustand').StoreApi<T>>;
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ): import('zustand').UseBoundStore<import('zustand').StoreApi<T>>;
};

// Re-export the commonly used functions with proper types
export const create: Create = (zustandCore.create || zustandCore.default?.create || zustandCore) as Create;
export const persist = zustandMiddleware.persist as typeof import('zustand/middleware').persist;
export const createJSONStorage = zustandMiddleware.createJSONStorage as typeof import('zustand/middleware').createJSONStorage;
export const devtools = zustandMiddleware.devtools as typeof import('zustand/middleware').devtools;
export const subscribeWithSelector = zustandMiddleware.subscribeWithSelector as typeof import('zustand/middleware').subscribeWithSelector;

// Export default for backward compatibility
export default {
  create,
  persist,
  createJSONStorage,
  devtools,
  subscribeWithSelector
};