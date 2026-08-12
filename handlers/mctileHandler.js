var {createProxyMiddleware} = require('http-proxy-middleware');
var {badPath} = require('./pathUtil.js');

var MC_TILE_PATH = process.env.MC_TILE_PATH || 'http://ca-mctile:8008/';

preMct = function(req, res, next) {
  if (req.query && req.query.DeepZoom) {
    var requested;
    var isDescriptor;
    if (req.query.DeepZoom.endsWith('.dzi')) {
      // dzi is not part of the filename
      requested = req.query.DeepZoom.slice(0, -4);
      isDescriptor = true;
    } else {
      // "<location>_files/<level>/<col>_<row>.<ext>"
      requested = req.query.DeepZoom;
      isDescriptor = false;
    }
    // requested is spliced directly into the proxied upstream path in
    // mctileHandler's pathRewrite below, with no auth/permission check in
    // front of it (unlike IIP_PATH's routes, there's no pathdb-style lookup
    // for mctile) -- reject path traversal here, the only validation point.
    if (badPath(requested)) {
      res.status(400).json({error: 'DeepZoom path not canonical or invalid'});
      return;
    }
    req.mctFileRequested = requested;
    req.mctIsDescriptor = isDescriptor;
  } else {
    req.mctFileRequested = false;
  }
  next();
};

// exported separately (rather than inlined in the proxy config) so it can be
// unit-tested without going through http-proxy-middleware/a real network
// call. Trusts preMct's badPath() validation -- does not re-check here.
function pathRewrite(path, req) {
  if (!req.mctFileRequested) {
    return path;
  }
  if (req.mctIsDescriptor) {
    // mctile's own descriptor route never reads style= (confirmed:
    // camicroscope-mctile/app/routes/dzi.py's dzi_descriptor doesn't
    // call _parse_style_param), so no query string is forwarded here.
    return '/dzi/' + req.mctFileRequested + '.dzi';
  }
  // Build the query string from req.query directly (already parsed by
  // Express) rather than re-slicing the raw path string -- avoids
  // depending on http-proxy-middleware's exact path/query composition
  // semantics, and lets us deliberately drop "token" (Caracal-side auth
  // only; mctile has no auth of its own, see
  // camicroscope-mctile/docs/API.md) and "DeepZoom" (already consumed
  // into req.mctFileRequested above) instead of forwarding them verbatim.
  var styleParam = req.query.style ?
    ('?style=' + encodeURIComponent(req.query.style)) : '';
  return '/dzi/' + req.mctFileRequested + styleParam;
}

mctileHandler = function(req, res, next) {
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
    target: MC_TILE_PATH,
    pathRewrite: pathRewrite,
  })(req, res, next);
};

mctileHandlers = {};
mctileHandlers.preMct = preMct;
mctileHandlers.mctileHandler = mctileHandler;
mctileHandlers.pathRewrite = pathRewrite;

module.exports = mctileHandlers;
