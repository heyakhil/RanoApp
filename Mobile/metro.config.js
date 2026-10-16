const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const imagePickerEntry = path.resolve(
  projectRoot,
  'node_modules/react-native-image-picker/src/index.ts',
);

/**
 * v8 publishes TypeScript source as `main`. Metro reports that entry as missing
 * until the request is mapped to the file itself.
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react-native-image-picker') {
        return {
          type: 'sourceFile',
          filePath: imagePickerEntry,
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
