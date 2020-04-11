// handle auth services
var jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
var atob = require('atob');
var fs = require('fs');
var filterFunction = require('./filterFunction.js');

var JWK_URL = process.env.JWK_URL;
var DISABLE_SEC = process.env.DISABLE_SEC || false;
var AUD = process.env.AUD || false;
var ISS = process.env.ISS || false;
var EXPIRY = process.env.EXPIRY || '1d';
var DEFAULT_USER_TYPE = process.env.DEFAULT_USER_TYPE || 'Null';
var PUBKEY;
var PRIKEY;

try {
  const prikeyPath = './keys/key';
  if (fs.existsSync(prikeyPath)) {
    PRIKEY = fs.readFileSync(prikeyPath, 'utf8');
  } else {
    if (DISABLE_SEC) {
      PRIKEY = '';
      console.warn('prikey null since DISABLE_SEC and no prikey provided');
    } else {
      console.error('prikey does not exist');
    }
  }
} catch (err) {
  console.error(err);
}

try {
  const prikeyPath = './keys/key.pub';
  if (fs.existsSync(prikeyPath)) {
    var PUBKEY = fs.readFileSync(prikeyPath, 'utf8');
  } else {
    if (DISABLE_SEC) {
      PUBKEY = '';
      console.warn('pubkey null since DISABLE_SEC and no prikey provided');
    } else {
      console.error('pubkey does not exist');
    }
  }
} catch (err) {
  console.error(err);
}


if (DISABLE_SEC && !JWK_URL) {
  var CLIENT = jwksClient({
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs', // a default value
  });
} else if (JWK_URL) {
  var CLIENT = jwksClient({
    jwksUri: JWK_URL,
  });
} else {
  console.error('need JWKS URL (JWK_URL)');
  process.exit(1);
}

const getToken = function(req) {
  if (req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer') { // Authorization: Bearer g1jipjgi1ifjioj
    // Handle token presented as a Bearer token in the Authorization header
    return req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    // Handle token presented as URI param
    return req.query.token;
  } else if (req.cookies && req.cookies.token) {
    // Handle token presented as a cookie parameter
    return req.cookies.token;
  }
};

function getJwtKid(token) {
  var base64Url = token.split('.')[0];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload).kid;
};

function jwkTokenTrade(jwksClient, signKey, userFunction) {
  return function(req, res) {
    var THISTOKEN = getToken(req);
    if (!THISTOKEN) {
      res.status(401).send('{"err":"no token found"}');
    }
    jwksClient.getSigningKey(getJwtKid(THISTOKEN), (err, key) => {
      // console.log(key);
      if (err) {
        console.error(err);
        res.status(401).send({
          'err': err,
        });
      } else {
        const useKey = key.publicKey || key.rsaPublicKey;
        tokenTrade(useKey, signKey, userFunction)(req, res);
      }
    });
  };
}

// curry these calls
function tokenTrade(checkKey, signKey, userFunction) {
  return function(req, res) {
    var THISTOKEN = getToken(req);
    const jwtOptions = {};
    if (AUD) {
      jwtOptions.audience = AUD;
    }
    if (ISS) {
      jwtOptions.issuer = ISS;
    }
    jwt.verify(THISTOKEN, checkKey, jwtOptions, function(err, token) {
      if (err) {
        console.error(err);
        res.status(401).send({
          'err': err,
        });
      } else {
        if (!(token && (token.email || token.sub))) {
          // jwt doesn't say who you are, so bye
          res.send(401).send({
            err: 'email and sub are unset from source token',
          });
        } else {
          userFunction(token).then((x) => {
            // console.log(x);
            if (x === false) {
              res.status(401).send({
                'err': 'User Unauthorized',
              });
            } else {
              data = x;
              delete data['exp'];
              // sign using the mounted key
              var token = jwt.sign(data, signKey, {
                algorithm: 'RS256',
                expiresIn: EXPIRY,
              });
              res.send({
                'token': token,
              });
            }
          }).catch((e) => {
            console.log(e);
            res.status(401).send(e);
          });
        }
      }
    });
  };
}

function loginHandler(checkKey) {
  return function(req, res, next) {
    if (DISABLE_SEC) {
      let token = jwt.decode(getToken(req)) || {};
      req.tokenInfo = token;
      req.userType = token.userType || DEFAULT_USER_TYPE || 'Null';
      req.userFilter = token.userFilter || ['Public'];
      next();
    } else {
      const jwtOptions = {};
      if (AUD) {
        jwtOptions.audience = AUD;
      }
      if (ISS) {
        jwtOptions.issuer = ISS;
      }
      jwt.verify(getToken(req), checkKey, jwtOptions, function(err, token) {
        if (err) {
          console.error(err);
          res.status(401).send({
            'err': err,
          });
        } else {
          req.tokenInfo = token;
          req.userType = token.userType || DEFAULT_USER_TYPE || 'Null';
          req.userFilter = token.userFilter || ['Public'];
          next();
        }
      });
    }
  };
}

// use filter handler AFTER data handler
function filterHandler(dataField, filterField, attrField) {
  return function(req, res, next) {
    req[dataField] = filterFunction(req[filterField], req[dataField], attrField, '**');
    next();
  };
}

// use edit handler AFTER a find route to populate data, but BEFORE the edit itself
function editHandler(dataField, filterField, attrField) {
  return function(req, res, next) {
    if (filterField && attrField) {
      req[dataField] = filterFunction(req[filterField], req[dataField], attrField, '**');
    }
    if (!Array.isArray(req[dataField])) {
      req[dataField] = [req[dataField]];
    }
    // edit routes should operate on one object
    if (req[dataField].length == 1) {
      // DESTROY query
      for (let n in req.query) {
        if (req.query.hasOwnProperty(n)) {
          delete req.query[n];
        }
      }
      req.query = {_id: req[dataField][0]._id['$oid']};
      next();
    } else if (req[dataField].length == 0) {
      let errorMessage = {};
      errorMessage.error = 'Nothing applicable to change.';
      errorMessage.statusCode = 400;
      next(errorMessage);
    } else {
      let errorMessage = {};
      errorMessage.error = 'At most one document may be changed at once.';
      errorMessage.statusCode = 400;
      next(errorMessage);
    }
  };
}

auth = {};
auth.jwkTokenTrade = jwkTokenTrade;
auth.tokenTrade = tokenTrade;
auth.filterHandler = filterHandler;
auth.loginHandler = loginHandler;
auth.editHandler = editHandler;
auth.CLIENT = CLIENT;
auth.PRIKEY = PRIKEY;
auth.PUBKEY = PUBKEY;

module.exports = auth;
