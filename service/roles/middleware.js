/**
 * This file contains the middleware that implements the role checks in the appplication
 */
// const routes = require('../../routes.json');

/**
 * Loading other services
 *
 * roles/roles => to summon all types of roles into the system
 *
 */
const { DEFAULT_ROLE } = require('./roles');
const { check } = require('./definitions');

/**
 * This middleware parses the incoming request for user role details and decides whether
 * or not to allow the user.
 *
 * Flow:
 * - Incoming User Request with auth headers
 * - Auth headers checked for role definitions
 * - If no role found, default role assigned
 * - Checked for role definitions in ./definitions.js
 * - Pass or Fail user
 * @function
 * @param {string} route route to attach the role checking service to
 * @param {{entity:string, operation:string}} access access identifier to identify resource
 */
const RouteProcessor = (route, access) => {
  const middleware = (req, res, next) => {
    /** express middleware definition */
    console.log('----------------------------------------');
    console.log(`user type :  ${req.userType}`);
    console.log('----------------------------------------');

    let userRole = DEFAULT_ROLE;

    /**  check if the incoming request contains a user role */
    if (req.userType) {
      userRole = req.userType;
    }

    /** destruct data from access */
    const { entity, operation } = access;

    /** check if the incoming request is allowed to access or not */
    switch (operation) {
      /** check for write/create writes */
      case 'create':
        if (!check.can(userRole).create(entity)) {
          return res
            .status(403)
            .send(`You are not allowed to create ${entity}`);
        }
        break;

      /** check for read rights */
      case 'read':
        if (!check.can(userRole).read(entity)) {
          return res.status(403).send(`You are not allowed to read ${entity}`);
        }
        break;

      /** check for update rights */
      case 'update':
        if (!check.can(userRole).update(entity)) {
          return res
            .status(403)
            .send(`You are not allowed to update ${entity}`);
        }
        break;

      /** check for delete rights */
      case 'delete':
        if (!check.can(userRole).delete(entity)) {
          return res
            .status(403)
            .send(`You are not allowed to delete ${entity}`);
        }
        break;

      default:
        /** check if a custom operation type is used
         * if so, then we check the custom operation
         */
        if (!check.can(userRole).read(`${entity}.${operation}`)) {
          return res
            .status(403)
            .send(`You are not allowed to operate on ${entity}.${operation}`);
        }
        break;
    }

    return next();
  };

  return middleware;
};

module.exports = { RouteProcessor };
