var ALLOW_PUBLIC = (process.env.ALLOW_PUBLIC === 'true');

var dataHandlers = require('./dataHandlers.js');
// userFunction -- used for login given id provider token
function userFunction(token) {
  return new Promise(function(res, rej) {
    dataHandlers.User.forLogin(token.email).then((x)=>{
      if (x.length <= 0) {
        if (ALLOW_PUBLIC) {
          const publicToken = {};
          publicToken.userFilter = ['Public'];
          publicToken.userType = 'Null';
          publicToken.email = token.email;
          publicToken.name = token.name;
          publicToken.picture = token.picture;
          res(publicToken);
        } else {
          rej(new Error('Public users not allowed on this instance'));
        }
      } else {
        const newToken = {};
        newToken.userType = x[0].userType || 'Null';
        newToken.userFilter = x[0].userFilter || ['Public'];
        newToken.sub = token.email;
        newToken.email = token.email;
        newToken.name = token.name;
        newToken.picture = token.picture;
        res(newToken);
      }
    });
  });
}


module.exports = userFunction;
