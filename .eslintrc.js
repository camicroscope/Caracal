module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: ['google'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'prettier/prettier': 'error',
    'object-curly-spacing': 'off',
    'require-jsdoc': 0,
    'space-before-function-paren': 'off',
    'quote-props': 'off',
    indent: 'off',
    'comma-dangle': 'off',
    'max-len': ['error', { code: 125, ignoreTemplateLiterals: true }],
  },
  plugins: ['prettier', 'security'],
  extends: ['plugin:security/recommended'],
};
