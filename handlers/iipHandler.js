var proxy = require('http-proxy-middleware');

var IIP_PATH = process.env.IIP_PATH || 'http://ca-iip/';

preIip = function(req, res, next) {
  if (req.query) {
    if (req.query.DeepZoom) {
      if (req.query.DeepZoom.endsWith('.dzi')) {
        // dzi is not part of the filename
        req.iipFileRequested = req.query.DeepZoom.slice(0, -4);
      } else {
        // just in case _files is in the filename for some reason
        req.iipFileRequested = req.query.DeepZoom.split('_files').slice(0, -1).join('/');
      }
    } else if (req.query.IIIF) {
      req.iipFileRequested = req.query.IIIF.split("/")[0];
    } else if (req.query.FIF) {
      req.iipFileRequested = req.query.FIF;
    } else {
      req.iipFileRequested = false;
    }
  }
  console.log(req.iipFileRequested);
  next();
};

iipHandler = function(req, res, next) {
  proxy({
    secure: false,
    onError(err, req, res) {
      console.log(err);
      err.statusCode = 500;
      next(err);
    },
    changeOrigin: true,
    target: IIP_PATH,
    pathRewrite: function(path, req) {
      if (req.newFilepath) {
        path = path.replace(req.iipFileRequested, req.newFilepath);
      }
      // NOTE -- this may need to change if the original url has more subdirs or so added
      var splitPath = path.split('/');
      console.log(path);
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

iipHandlers = {};
iipHandlers.preIip = preIip;
iipHandlers.iipHandler = iipHandler;


module.exports = iipHandlers;
