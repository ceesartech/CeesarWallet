const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Aggressive EMFILE prevention
config.watchFolders = [];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Disable file watching completely for development
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Skip watching for certain file types
      if (req.url.includes('.log') || req.url.includes('.tmp') || req.url.includes('node_modules')) {
        return next();
      }
      return middleware(req, res, next);
    };
  },
};

// Disable file watching
config.watcher = {
  additionalExts: [],
  watchman: {
    deferStates: ['hg.update'],
  },
};

// Reduce resolver scope
config.resolver = {
  ...config.resolver,
  blockList: [
    /node_modules\/.*\/node_modules\/react-native\/.*/,
  ],
};

module.exports = config;
