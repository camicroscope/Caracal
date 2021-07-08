/**
 * This file contains the middleware that implements the role checks in the appplication
 */
const routes = require('../../routes.json');

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
 *
 * @param {Request} req Incoming HTTP Request
 * @param {Response} res Express.js response object
 * @param {Next} next call to control to next middlewate
 */
const RouteProcessor = (req, res, next) => {
  /** express middleware definition */
  console.log('----------------------------------------');
  console.log(`user type :  ${req.userType}`);
  console.log('----------------------------------------');
  next();
};

module.exports = { RouteProcessor };
