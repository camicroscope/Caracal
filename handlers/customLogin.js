var jwt = require('jsonwebtoken');

var EXPIRY = process.env.EXPIRY || '1d';


function customLogin(usernameField, usertypeField) {
  return function(req, res) {
    let token = {};
    // get user id from env
    username = process.env[usernameField] || "unknown user";
    token['sub'] = username;
    token['email'] = username;
    token['name ']= username;
    usertype = process.env[usertypeField];
    token['userType'] = usertype || "Participant";
    // generate token with this info
    // return the token
    signedToken = jwt.sign(token, "precision-fda-not-secure-token", {
      expiresIn: EXPIRY,
    });
    res.json({"token": signedToken});
  };
}

module.exports = customLogin;
