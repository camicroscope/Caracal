const fs = require('fs').promises;
const uuid = require("uuid");

// write a file containing the request body
function writeFile(path, prefix) {
  return function(req, res, next) {
    let fn = prefix + "_" + uuid.v4();
    var data = JSON.parse(req.body);
    fs.writeFile(path + fn, data).then(()=>next()).catch((e) => next(e));
  };
};

fileHandlers = {};
fileHandlers.writeFile = writeFile;
module.exports = fileHandlers;
