module.exports = {
  presets: ['module:@react-native/babel-preset'],
  overrides: [
    {
      test: /node_modules[\\/]react-native-image-picker[\\/]/,
      presets: ['module:@react-native/babel-preset'],
    },
  ],
};
