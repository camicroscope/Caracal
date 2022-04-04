// EXTENDS authHandlers
const proxy = require('http-proxy-middleware');
var jwt = require('jsonwebtoken');
var EXPIRY = process.env.EXPIRY || '1d';
var BYPASS_IIP_CHECK = process.env.BYPASS_IIP_CHECK == "Y";
const auth = require('./authHandlers.js');

import fetch from 'node-fetch';

// internal function to issue a new jwt
function issueToken(data, signKey) {
  return jwt.sign(data, signKey, {
    algorithm: 'RS256',
    expiresIn: EXPIRY,
  });
}

slideTokenGen = function(req, res, next) {
  if (req.query.slide) {
    // url for checking if user has access to this slide
    const PDB_URL = process.env.PDB_URL ||`http://quip-pathdb`;
    let lookupUrl = PDB_URL + "/node/" + req.query.slide + "?_format=json";
    let new_req_headers = {}
    console.log("\n\n\n", req.headers)
    if (req.headers.cookie) {
      new_req_headers['Cookie'] = req.headers.cookie
    }
    if (req.headers.authorization) {
      new_req_headers['Authorization'] = req.headers.authorization
    }
    fetch(lookupUrl, {headers: new_req_headers}).then((x)=>{
      // get path
      if (x && x['field_iip_path'] && x['field_iip_path'].length && x['field_iip_path']['value']) {
        let filepath = x['field_iip_path']['value'];
        // issue token including this slidepath as activeSlide
        let token = req.tokenInfo;
        token.activeSlide = filepath;
        res.data = issueToken(token, auth.PRIKEY);
        next();
      } else {
        // do not issue token
        let err = {};
        err.message = "unauthorized token request";
        err.statusCode = 401;
        next(err);
      }
    }).catch((e)=>{
      console.error(e);
      next(e);
    });
  } else {
    let err = {};
    err.message = "malformed token request";
    err.statusCode = 400;
    next(err);
  }
};

slideTokenCheck = function(req, res, next) {
  if (!BYPASS_IIP_CHECK) {
    if (req.iipFileRequested && req.iipFileRequested == req.token.activeSlide) {
      next();
    } else {
      // do not return
      let err = {};
      err.message = "unauthorized slide request";
      err.statusCode = 401;
      next(err);
    }
  } else {
    next();
  }
};

let pih = {};
pih.slideTokenGen = slideTokenGen;
pih.slideTokenCheck = slideTokenCheck;

module.exports = pih;
