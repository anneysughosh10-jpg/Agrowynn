const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const CORE_MODULE_WEB_DIR = path.join('expo-modules-core', 'build', 'web');
const CORE_MODULE_BUILD_DIR = path.join('expo-modules-core', 'build');
const PATCH_CORE_MODULE = path.resolve(__dirname, 'patches', 'CoreModule.js');
const PATCH_CREATE_WEB_MODULE = path.resolve(__dirname, 'patches', 'createWebModule.web.js');

// On web builds, redirect two expo-modules-core files to patched versions that
// add the missing `registerWebModule` function (needed by expo-font / @expo/vector-icons).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // expo-modules-core/build/web/index.web.js imports './CoreModule'
    if (
      moduleName === './CoreModule' &&
      context.originModulePath.includes(CORE_MODULE_WEB_DIR)
    ) {
      return { filePath: PATCH_CORE_MODULE, type: 'sourceFile' };
    }

    // expo-modules-core/build/index.js does `export * from './createWebModule'`
    // On web, Metro resolves that to createWebModule.web.js.
    // Our patch also exports registerWebModule so it ends up on the public API.
    if (
      moduleName === './createWebModule' &&
      context.originModulePath.includes(CORE_MODULE_BUILD_DIR) &&
      !context.originModulePath.includes('patches')
    ) {
      return { filePath: PATCH_CREATE_WEB_MODULE, type: 'sourceFile' };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
