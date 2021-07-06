/** importing packages and modules */
const atob = require('atob');
const jwt = require('jsonwebtoken');

/** import local dependencies and services */
const filterFunction = require('./filterFunction');

/**
 * Loading services
 *
 * roles => to operate on roles and rights
 * keys => to operate on keys and security
 */
const { DEFAULT_ROLE } = require('../service/roles/roles');
const {
  generateKeysIfMissing,
  getJWKSClient,
  readPrivateKey,
  readPublicKey,
} = require('../service/keys');

/**
 * Loading environment variables. for details about configurations, check .env.config
 *
 * AUD : the audience accepted by the service
 * ISS : the issuer of the token
 * EXPIRY : timestamp when jwks expires, default = 1d
 */
const {
  AUD, ISS, EXPIRY, ENABLE_SECURITY_AT,
} = process.env;

/**
 * generate the keys if they are missing from /keys directory
 */
generateKeysIfMissing();

/**
 * Read public and private keys from local fs, giving due respect to security configurations.
 */
const keys = {
  private: readPrivateKey(),
  public: readPublicKey(),
};

/**
 provides a JWKS client based on configurations which can be directly exported from the auth handler
 */
const CLIENT = getJWKSClient();

/**
 * Returns the token parsed either from the authorization header, the query param, or a cookie
 * @param {Request} req incoming http request
 * @returns {string} token
 */
const getToken = function (req) {
  /** Authorization: Bearer tokenHere */
  if (
    req.headers.authorization
    && req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    return req.headers.authorization.split(' ')[1];
  }

  /** Token from query param */
  if (req.query && req.query.token) {
    return req.query.token;
  }

  /** Token as a cookie */
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
};

function getJwtKid(token) {
  const base64Url = token.split('.')[0];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''),
  );

  return JSON.parse(jsonPayload).kid;
}

// curry these calls
function tokenTrade(checkKey, signKey, userFunction) {
  return function middleware(req, res) {
    const THISTOKEN = getToken(req);
    const jwtOptions = {};
    if (AUD) {
      jwtOptions.audience = AUD;
    }
    if (ISS) {
      jwtOptions.issuer = ISS;
    }
    jwt.verify(THISTOKEN, checkKey, jwtOptions, (err, token) => {
      if (err) {
        console.error(err);
        return res.status(401).send({ err });
      }

      if (!(token && (token.email || token.sub))) {
        // jwt doesn't say who you are, so bye
        res.send(401).send({
          err: 'email and sub are unset from source token',
        });
      } else {
        userFunction(token)
          .then((x) => {
            // console.log(x);
            if (x === false) {
              res.status(401).send({
                err: 'User Unauthorized',
              });
            } else {
              const data = x;
              delete data.exp;
              // sign using the mounted key
              const newToken = jwt.sign(data, signKey, {
                algorithm: 'RS256',
                expiresIn: EXPIRY,
              });
              res.send({ token: newToken });
            }
          })
          .catch((e) => {
            console.log(e);
            res.status(401).send(e);
          });
      }
    });
  };
}

function jwkTokenTrade(jwksClient, signKey, userFunction) {
  return function (req, res) {
    const token = getToken(req);
    if (!token) {
      return res.status(401).send('{"err":"no token found"}');
    }

    jwksClient.getSigningKey(getJwtKid(token), (err, key) => {
      if (err) {
        console.error(err);
        return res.status(401).send({
          err,
        });
      }

      const useKey = key.publicKey || key.rsaPublicKey;
      tokenTrade(useKey, signKey, userFunction)(req, res);
    });
  };
}

/**
 *
 * @param {string} checkKey
 * @returns {Middleware} express middleware to process auth layer
 */
function loginHandler(checkKey) {
  /** return a middle */
  return function (req, res, next) {
    /** if security enabled after a timestamp */
    if (
      DISABLE_SEC
      || (ENABLE_SECURITY_AT && Date.parse(ENABLE_SECURITY_AT) > Date.now())
    ) {
      let token = {};
      try {
        token = jwt.decode(getToken(req)) || {};
      } catch (e) {
        console.warn(e);
      }
      req.tokenInfo = token;
      req.userType = token.userType || DEFAULT_ROLE || 'Null';
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
      jwt.verify(getToken(req), checkKey, jwtOptions, (err, token) => {
        if (err) {
          console.error(err);
          res.status(401).send({
            err,
          });
        } else {
          req.tokenInfo = token;
          req.userType = token.userType || DEFAULT_ROLE || 'Null';
          req.userFilter = token.userFilter || ['Public'];
          next();
        }
      });
    }
  };
}

// use filter handler AFTER data handler
function filterHandler(dataField, filterField, attrField) {
  return function (req, res, next) {
    req[dataField] = filterFunction(
      req[filterField],
      req[dataField],
      attrField,
      '**',
    );
    next();
  };
}

// use edit handler AFTER a find route to populate data, but BEFORE the edit itself
function editHandler(dataField, filterField, attrField) {
  return function (req, res, next) {
    if (filterField && attrField) {
      req[dataField] = filterFunction(
        req[filterField],
        req[dataField],
        attrField,
        '**',
      );
    }
    if (!Array.isArray(req[dataField])) {
      req[dataField] = [req[dataField]];
    }
    // edit routes should operate on one object
    if (req[dataField].length == 1) {
      // DESTROY query
      for (const n in req.query) {
        if (req.query.hasOwnProperty(n)) {
          delete req.query[n];
        }
      }
      req.query = { _id: req[dataField][0]._id.$oid };
      next();
    } else if (req[dataField].length == 0) {
      const errorMessage = {};
      errorMessage.error = 'Nothing applicable to change.';
      errorMessage.statusCode = 400;
      next(errorMessage);
    } else {
      const errorMessage = {};
      errorMessage.error = 'At most one document may be changed at once.';
      errorMessage.statusCode = 400;
      next(errorMessage);
    }
  };
}

/** return true or false based on whether security is enabled or not */
function firstSetupUserSignupExists() {
  return function (req, res) {
    if (ENABLE_SECURITY_AT && Date.parse(ENABLE_SECURITY_AT) > Date.now()) {
      res.send({
        exists: true,
      });
    } else {
      res.send({
        exists: false,
      });
    }
  };
}

/** export authHandler functions */
module.exports = {
  jwkTokenTrade,
  tokenTrade,
  filterHandler,
  loginHandler,
  editHandler,
  firstSetupUserSignupExists,
  CLIENT,
  PRIKEY: keys.private,
  PUBKEY: keys.public,
};
