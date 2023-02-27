// echo enviornment variables
function envEcho() {
  return function(req, res, next) {
    req.data = process.env;
    next();
  };
}


module.exports = envEcho;
