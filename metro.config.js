const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

// In web dev, proxy /api/v1/* to staging backend — same pattern as the FE Next.js proxy.
// Avoids CORS issues when testing on localhost.
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith('/api/v1')) {
        createProxyMiddleware({
          target: 'https://api.stage.qliniq.ai',
          changeOrigin: true,
          secure: true,
        })(req, res, next);
      } else {
        middleware(req, res, next);
      }
    };
  },
};

module.exports = config;
