module.exports = {
  'env': {
    'browser': true,
    'node': true,
    'es6': true,
  },
  'extends': [
    'google',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
  },
  'rules': {
    "require-jsdoc" : 0,
    "valid-jsdoc" : 0,
    "max-len" : ["error", { "code": 120 ,"ignoreTemplateLiterals": true},],
    "no-unused-vars" : 0,
    "no-var" : 0,
    "prefer-const":0,
    "quotes": 0
  },
};
