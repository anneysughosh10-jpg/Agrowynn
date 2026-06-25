// Patched version of expo-modules-core/build/web/CoreModule.js
// Adds the missing registerWebModule function required by expo-font / @expo/vector-icons.

class EventEmitter {
  addListener(eventName, listener) {
    if (!this.listeners) this.listeners = new Map();
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName).add(listener);
    return { remove: () => this.removeListener(eventName, listener) };
  }
  removeListener(eventName, listener) {
    this.listeners?.get(eventName)?.delete(listener);
  }
  removeAllListeners(eventName) {
    this.listeners?.get(eventName)?.clear();
  }
  emit(eventName, ...args) {
    this.listeners?.get(eventName)?.forEach((listener) => listener(...args));
  }
  listenerCount(eventName) {
    return this.listeners?.get(eventName)?.size ?? 0;
  }
}

export class NativeModule extends EventEmitter {
  ViewPrototype;
  __expo_module_name__;
}

class SharedObject extends EventEmitter {
  release() {
    throw new Error('Method not implemented.');
  }
}

globalThis.expo = {
  EventEmitter,
  NativeModule,
  SharedObject,
  modules: {},
  uuidv4: () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  },
  uuidv5: undefined,
  getViewConfig: () => { throw new Error('Method not implemented.'); },
  reloadAppAsync: async () => { window.location.reload(); },
};

export function registerWebModule(factory, name) {
  // Use `new factory()` to handle ES6 class constructors (expo-font passes classes,
  // not factory functions). JS spec: if a constructor returns an object, `new` returns
  // that object — so this also works for factory-function patterns.
  const mod = typeof factory === 'function' ? new factory() : factory;
  if (globalThis.expo?.modules && name) {
    globalThis.expo.modules[name] = mod;
  }
  return mod;
}
