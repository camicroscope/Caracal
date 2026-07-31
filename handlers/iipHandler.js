var {createProxyMiddleware} = require('http-proxy-middleware');

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

function removeParameterFromUrl(url, parameter) {
  return url
      .replace(new RegExp('[?&]' + parameter + '=[^&#]*(#.*)?$'), '$1')
      .replace(new RegExp('([?&])' + parameter + '=[^&]*&'), '$1');
}

// Use req.originalUrl (never mutated by Express's own mount-path stripping),
// not the possibly-already-stripped req.url -- http-proxy-middleware v3 no
// longer restores req.originalUrl into req.url the way older versions
// implicitly did, and this slicing is calibrated against the full original
// path. Exported standalone (rather than inlined in the proxy config) so
// it's unit-testable without going through http-proxy-middleware/a real
// network call.
function rewritePath(req) {
  var fullPath = req.originalUrl;
  if (req.newFilepath) {
    fullPath = fullPath.replace(req.iipFileRequested, req.newFilepath);
  }
  // remove token if present
  fullPath = removeParameterFromUrl(fullPath, "token");
  var splitPath = fullPath.split('/');
  return '/' + splitPath.slice(2, splitPath.length).join('/');
}

iipHandler = function(req, res, next) {
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
    target: IIP_PATH,
    pathRewrite: function(path, req) {
      return rewritePath(req);
    },
  })(req, res, next);
};

iipHandlers = {};
iipHandlers.preIip = preIip;
iipHandlers.iipHandler = iipHandler;
iipHandlers.rewritePath = rewritePath;


module.exports = iipHandlers;
