const ALLOW_PUBLIC = process.env.ALLOW_PUBLIC === 'true';

const dataHandlers = require('./dataHandlers.js');

/**
 * Loading services
 *
 * roles => to operate on roles and summon default roles
 */
const { DEFAULT_ROLE } = require('../service/roles/roles');

/**
 * Used for login
 * @param {string} token JWT token in decoded format to read data about current user
 * @returns Promise<Middleware> Express Middleware
 */
function userFunction(token) {
  return new Promise((resolve, reject) => {
    dataHandlers.User.forLogin(token.email).then((x) => {
      if (x.length <= 0) {
        if (ALLOW_PUBLIC) {
          const publicToken = {};
          publicToken.userFilter = ['Public'];
          publicToken.userType = DEFAULT_ROLE;
          publicToken.email = token.email;
          publicToken.name = token.name;
          publicToken.picture = token.picture;
          resolve(publicToken);
        } else {
          reject(new Error('Public users not allowed on this instance'));
        }
      } else {
        const newToken = {};
        newToken.userType = x[0].userType || DEFAULT_ROLE;
        newToken.userFilter = x[0].userFilter || ['Public'];
        newToken.sub = token.email;
        newToken.email = token.email;
        newToken.name = token.name;
        newToken.picture = token.picture;
        resolve(newToken);
      }
    });
  });
}

module.exports = userFunction;
