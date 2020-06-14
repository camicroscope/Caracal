var proxy = require('http-proxy-middleware');

proxyHandler = function(target, n) {
  n = n || 2;
  return function(req, res, next) {
    proxy({
      secure: false,
      onError(err, req, res) {
        console.log(err);
        err.statusCode = 500;
        next(err);
      },
      changeOrigin: true,
      target: target,
      pathRewrite: function(path, req) {
        console.log(target);
        console.log(path);
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
