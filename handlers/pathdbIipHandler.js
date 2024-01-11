// EXTENDS authHandlers
const proxy = require('http-proxy-middleware');
var jwt = require('jsonwebtoken');
var EXPIRY = process.env.EXPIRY || '1d';
var BYPASS_IIP_CHECK = process.env.BYPASS_IIP_CHECK == "Y";
const auth = require('./authHandlers.js');
const fetch = require('cross-fetch');

// internal function to issue a new jwt
function issueToken(data, signKey) {
  return jwt.sign(data, signKey, {
    algorithm: 'RS256',
    expiresIn: EXPIRY,
  });
}

iipCheck = function(req, res, next) {
  if (!BYPASS_IIP_CHECK) {
    if (req.iipFileRequested) {
      // rewrite path first
      const PDB_URL = process.env.PDB_URL || 'http://quip-pathdb';
      let requestedNode = req.iipFileRequested.replace("pathdb*", "");
      let lookupUrl = PDB_URL + "/node/" + requestedNode + "?_format=json";
      console.log(lookupUrl);
      let pdbReqHeaders = {"Authorization": "Bearer " + auth.getToken(req)};
      console.log(pdbReqHeaders);
      fetch(lookupUrl, {headers: pdbReqHeaders}).then((x)=>x.json()).then((x)=>{
        console.log(x);
        // get path
        if (x && x['field_iip_path'] && x['field_iip_path'].length && x['field_iip_path'][0]['value']) {
          newFilepath = x['field_iip_path'][0]['value'];
          newFilepath = encodeURIComponent(newFilepath);
          newFilepath = newFilepath.replaceAll("%2F", "/");
          req.newFilepath = newFilepath;
          console.log(req.newFilepath);
          next();
        } else {
          let err = {};
          err.message = "unauthorized slide request";
          err.statusCode = 401;
          next(err);
        }
      }).catch((e)=>{
        console.error(e);
        next(e);
      });
    } else {
      // do not return
      let err = {};
      err.message = "unauthorized slide request";
      err.statusCode = 401;
      next(err);
    }
  } else {
    // NOTE -- this instead uses the actual value given instead
    next();
  }
};

let pih = {};
pih.iipCheck = iipCheck;

module.exports = pih;
