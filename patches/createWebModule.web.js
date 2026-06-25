// Patched createWebModule for web builds.
// Adds the missing registerWebModule function that expo-font / @expo/vector-icons require.
// build/index.js does `export * from './createWebModule'`, so everything exported here
// lands on the expo-modules-core public API.

import { NativeModule } from './CoreModule';

export function createWebModule(moduleImplementation) {
  const module = new NativeModule();
  return Object.assign(module, moduleImplementation);
}

export function registerWebModule(factory, name) {
  // Use `new factory()` to handle ES6 class constructors (expo-font passes classes,
  // not factory functions). JS spec: if a constructor returns an object, `new` returns
  // that object — so this also works for factory-function patterns.
  const mod = typeof factory === 'function' ? new factory() : factory;
  if (typeof globalThis !== 'undefined' && globalThis.expo?.modules && name) {
    globalThis.expo.modules[name] = mod;
  }
  return mod;
}
