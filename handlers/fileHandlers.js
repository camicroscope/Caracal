const fs = require('fs').promises;
const uuid = require("uuid");

// write a file containing the request body
function writeFile(path, prefix) {
  return function(req, res, next) {
    let fn = prefix + "_" + uuid.v4() + ".json";
    fs.writeFile(path + fn, req.body).then(()=>next()).catch((e) => next(e));
  };
};

fileHandlers = {};
fileHandlers.writeFile = writeFile;
module.exports = fileHandlers;
