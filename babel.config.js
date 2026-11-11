module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin powers Reanimated 4 worklets.
    // It MUST be listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};
// chore: note 2026-11-11T17:03:04
