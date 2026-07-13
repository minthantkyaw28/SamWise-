// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle the mock gov.uk page (assets/mock-site.html) as an asset so the
// WebView can load it from disk with no network dependency at demo time.
config.resolver.assetExts.push('html');

module.exports = config;
// chore: note 2026-07-13T12:15:21
