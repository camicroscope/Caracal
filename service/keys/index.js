const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const jwksClient = require('jwks-rsa');

/**
 * data to append towards the start and end of command
 */
const commands = {
  pre: 'openssl req -subj ',
  post: ' -x509 -nodes -newkey rsa:2048 -keyout ./keys/key -out ./keys/key.pub',
};

/**
 * declare location of keys
 */
const location = {
  privateKey: path.join(__dirname, '../../keys/key'),
  publicKey: path.join(__dirname, '../../keys/key.pub'),
};

/**
 * load system configurations
 */
const { GENERATE_KEY_IF_MISSING, ENABLE_SECURITY_AT, DISABLE_SEC, JWK_URL } =
  process.env;
const env = {
  DISABLE_SEC: DISABLE_SEC == 'true',
  ENABLE_SECURITY_AT: ENABLE_SECURITY_AT || false,
  GENERATE_KEY_IF_MISSING: GENERATE_KEY_IF_MISSING == 'true',
  JWK_URL,
};

/**
 * Returns true or false based on three conditions. If security enabled
 * timestamp provided, if security is disabled, and if passed timestamp
 * has passed or not.
 *
 * @returns {boolean} whether security is enabled or not in the system
 */
const isSecurityDisabled = () => {
  if (!env.ENABLE_SECURITY_AT) {
    return false;
  }

  if (env.DISABLE_SEC) {
    return true;
  }

  return Date.parse(ENABLE_SECURITY_AT) > Date.now();
};

/**
 * this method will generate the keys if they are missing
 * from /keys directory
 */
const generateKeysIfMissing = () => {
  /**
   * keeping the env as first comparison will skip file operations
   * if generation is disabled from configurations. If the file
   * operations are kept first, then fs access is performed irrespective
   * of application configurations.
   *
   * This will generate a new config whenever either of the keys are missing
   * and the application config allows generation
   */
  if (
    env.GENERATE_KEY_IF_MISSING &&
    (!fs.existsSync(location.privateKey) || !fs.existsSync(location.publicKey))
  ) {
    try {
      execSync(
        `${commands.pre}'/CN=www.camicroscope.com/O=caMicroscope Local Instance Key./C=US'${commands.post}`,
      );
    } catch (err) {
      console.log({ err });
    }
  }
};

/**
 * this method returns the private key if security rules are in place
 */
const readPrivateKey = () => {
  /** if security is disabled, skip all checks and return empty */
  if (isSecurityDisabled()) {
    console.warn('private key null, security rules disabled');
    return '';
  }

  try {
    if (fs.existsSync(location.privateKey)) {
      return fs.readFileSync(location.privateKey, 'utf8');
    }
    console.warn('private key does not exist');
  } catch (err) {
    console.error(err);
  }
};

/**
 * this method returns the public key if security rules does not exist
 */
const readPublicKey = () => {
  /** if security is disabled, skip all checks and return empty */
  if (isSecurityDisabled()) {
    console.warn('public key null, security rules disabled');
    return '';
  }

  try {
    if (fs.existsSync(location.publicKey)) {
      return fs.readFileSync(location.publicKey, 'utf8');
    }
    console.warn('private key does not exist');
  } catch (err) {
    console.error(err);
  }
};

/**
 * this method provides a JWKS client based on configurations which can be directly
 * exported from the auth handler
 */
const getJWKSClient = () => {
  if (env.DISABLE_SEC && !env.JWK_URL) {
    return jwksClient({
      jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
    });
  }

  if (env.JWK_URL) {
    return jwksClient({
      jwksUri: JWK_URL,
    });
  }

  console.error('need JWKS URL (JWK_URL)');
  process.exit(1);
};

module.exports = {
  getJWKSClient,
  readPublicKey,
  readPrivateKey,
  generateKeysIfMissing,
};
