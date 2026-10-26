const noHardcodedStrings = require('./no-hardcoded-strings');

module.exports = {
  extends: ['./base.js', 'next/core-web-vitals'],
  plugins: {
    'custom-i18n': {
      rules: {
        'no-hardcoded-strings': noHardcodedStrings,
      },
    },
  },
  rules: {
    'custom-i18n/no-hardcoded-strings': 'warn',
    '@next/next/no-html-link-for-pages': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};
