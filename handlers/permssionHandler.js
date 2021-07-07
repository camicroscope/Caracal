/**
 * @depreciated
 *
 * This is legacy code of the previous permissionHandler.
 * This is no longer used, as all routes are checked for roles
 */

const { isSecurityDisabled } = require('../service/keys');

/**
 * This is legacy code of the permission handler which is no longer used. This is being replaced by
 * Role based access control that checks each and every route for roles defined in /services/roles.
 *
 * The roles service is responsible for assigning the roles to validated users, and declining access
 *
 * @deprecated
 * @param {Array<string>} permissionList Array of permissions that are allowed to access this route
 * @param {bool} test setting test=true will bypass the role check
 * @returns {Middleware} express middleware
 */
function permissionHandler(permissionList, test = false) {
  return (req, res, next) => {
    /** if security disabled, or testing mode enabled, then do not check for roles */
    if (isSecurityDisabled() || test) {
      req.permission_ok = true;
      next();
    } else if (
      req.tokenInfo.userType &&
      permissionList.indexOf(req.tokenInfo.userType) >= 0
    ) {
      /** if user belongs to the correct role mapping */
      req.permission_ok = true;
      next();
    } else {
      /** when user not allowed to move furhter */
      req.permission_ok = false;
      const errorMessage = { statusCode: 401 };
      errorMessage.error = 'Permission not granted';
      next(errorMessage);
    }
  };
}

module.exports = permissionHandler;
