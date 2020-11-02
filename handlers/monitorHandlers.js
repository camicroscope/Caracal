// handle monitoring checks

let monitor = {};

monitor.check = function(type) {
  let checkMsg = False;
  if (type == "basic") {
    checkMsg = {"status": "up", "checkType": "basic"};
  }
  // send the message
  return new Promise(function(res, rej) {
    if (checkMsg) {
      res(checkMsg);
    } else {
      rej(new Error("Check type not implemented"));
    }
  });
};


module.exports = monitor;
