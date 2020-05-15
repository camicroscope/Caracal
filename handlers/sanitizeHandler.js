var ERR_ON_SANITIZE = (process.env.ERR_ON_SANITIZE === 'true') || false;

function sanitizeBody(req, res, next) {
  // handle req body edgecases
  if (ERR_ON_SANITIZE) {
    if (req.body.indexOf("<") >=0 || req.body.indexOf(">") >=0) {
      let e = {'statusCode': 400};
      e.error = 'Characters < and > disallowed in body.';
      next(e);
    } else {
      next();
    }
  } else {
    req.body = req.body.replace(/</g, "");
    req.body = req.body.replace(/>/g, "");
    next();
  }
}

module.exports = sanitizeBody;
