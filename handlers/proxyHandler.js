var {createProxyMiddleware} = require('http-proxy-middleware');

// Use originalUrl (never mutated by Express's own mount-path stripping), not
// the possibly-already-stripped req.url -- http-proxy-middleware v3 no
// longer restores req.originalUrl into req.url the way older versions
// implicitly did, and this slicing is calibrated against the full original
// path, not whatever remainder Express's own per-layer stripping happens to
// leave (which varies depending on whether the target's own routes overlap
// with this mount's name). Exported standalone (rather than inlined in the
// proxy config) so it's unit-testable without going through
// http-proxy-middleware/a real network call.
function rewritePath(originalUrl, n) {
  var splitPath = originalUrl.split('/');
  return '/' + splitPath.slice(n, splitPath.length).join('/');
}

proxyHandler = function(target, n) {
  n = n || 2;
  return function(req, res, next) {
    createProxyMiddleware({
      secure: false,
      on: {
        error(err, req, res) {
          console.log(err);
          err.statusCode = 500;
          next(err);
        },
        proxyReq: function(proxyReq, req, res) {
          if (req.method == 'POST') {
            proxyReq.write(req.body);
            proxyReq.end();
          }
        },
      },
      changeOrigin: true,
      target: target,
      pathRewrite: function(path, req) {
        return rewritePath(req.originalUrl, n);
      },
    })(req, res, next);
  };
};

proxyHandler.rewritePath = rewritePath;

module.exports = proxyHandler;
