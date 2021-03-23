var proxy = require('http-proxy-middleware');
const {logger} = require('../service/logger/winston');

proxyHandler = function(target, n) {
  n = n || 2;
  return function(req, res, next) {
    proxy({
      secure: false,
      onError(err, req, res) {
        logger.error(err);
        err.statusCode = 500;
        next(err);
      },
      changeOrigin: true,
      target: target,
      pathRewrite: function(path, req) {
        logger.info(target);
        logger.info(path);
        // NOTE -- this may need to change if the original url has more subdirs or so added
        var splitPath = path.split('/');
        return '/' + splitPath.slice(n, splitPath.length).join('/');
      },
      onProxyReq: function(proxyReq, req, res) {
        if (req.method == 'POST') {
          proxyReq.write(req.body);
          proxyReq.end();
        }
      },
    })(req, res, next);
  };
};


module.exports = proxyHandler;
