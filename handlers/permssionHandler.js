var DISABLE_SEC = (process.env.DISABLE_SEC === 'true') || false;
var ENABLE_SECURITY_AT = (process.env.ENABLE_SECURITY_AT ? process.env.ENABLE_SECURITY_AT : "") || false;

try {
  if (ENABLE_SECURITY_AT) {
    DISABLE_SEC = true;
    var countDown = Date.parse(ENABLE_SECURITY_AT) - Date.now();
    setTimeout(() => {
      DISABLE_SEC = false;
    }, countDown);
  }
} catch (error) {
  console.error('error: ' + error);
}

function permissionHandler(permissionList, test=false) {
  return function(req, res, next) {
    if (!test && DISABLE_SEC) {
      req.permission_ok = true;
      next();
    } else {
      if (req.tokenInfo.userType && permissionList.indexOf(req.tokenInfo.userType) >= 0) {
        req.permission_ok = true;
        next();
      } else {
        req.permission_ok = false;
        let errorMessage = {'statusCode': 401};
        errorMessage.error = 'Permission not granted';
        next(errorMessage);
      }
    }
  };
}

module.exports = permissionHandler;
