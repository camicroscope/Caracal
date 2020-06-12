var proxy = require('http-proxy-middleware');

proxyHandler = function(PATH){
  return function(req, res, next) {
    proxy({
      secure: false,
      onError(err, req, res) {
        console.log(err);
        err.statusCode = 500;
        next(err);
      },
      changeOrigin: true,
      target: PATH,
      pathRewrite: function(path, req) {
        console.log(PATH)
        console.log(path)
        // NOTE -- this may need to change if the original url has more subdirs or so added
        var splitPath = path.split('/');
        return '/' + splitPath.slice(2, splitPath.length).join('/');
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
