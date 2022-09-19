// echo enviornment variables
function envEcho() {
  return function(req, res, next) {
    req.data = process.env;
  };
}


module.exports = envEcho;
