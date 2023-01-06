const fs = require('fs').promises;
const uuid = require("uuid");
var file_prefix = process.env.file_prefix;

// write a file containing the request body
function writeFile(path, prefix) {
  return function(req, res, next) {
    if (file_prefix){
      prefix = file_prefix + "_" + prefix;
    }
    let fn = prefix + "_" + uuid.v4() + ".json";
    const json = JSON.parse(req.body);
    json.create_date = new Date();
    req.body = JSON.stringify(json);
    fs.writeFile(path + fn, req.body).then(()=>next()).catch((e) => next(e));
  };
};

fileHandlers = {};
fileHandlers.writeFile = writeFile;
module.exports = fileHandlers;
