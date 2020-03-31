var dataHandlers = require('./dataHandlers.js');
// userFunction -- used for login given id provider token
function userFunction(token) {
  return new Promise(function(res, rej) {
    dataHandlers.User.forLogin(token.email).then((x)=>{
      if (x.length <= 0) {
        const publicToken = {};
        publicToken.userFilter = ['Public'];
        publicToken.userType = 'Null';
        publicToken.email = token.email;
        publicToken.name = token.name;
        publicToken.picture = token.picture;
        res(publicToken);
      } else {
        const newToken = {};
        newToken.userType = x[0].userType;
        newToken.userFilter = x[0].userFilter;
        newToken.sub = x[0].sub;
        newToken.email = token.email;
        newToken.name = token.name;
        newToken.picture = token.picture;
        res(newToken);
      }
    });
  });
}


module.exports = userFunction;
