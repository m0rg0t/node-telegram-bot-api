const js = require('@eslint/js');
const globals = require('globals');
module.exports = [
  { ignores: ['lib/**', 'node_modules/**'] },
  js.configs.recommended,
  { languageOptions: { sourceType: 'commonjs', globals: { ...globals.node, ...globals.mocha } },
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-param-reassign': ['error', { props: false }],
      'no-console': 'error',
      'prefer-rest-params': 'error',
      'max-len': ['error', { code: 200 }]
    }
  },
  { files: ['scripts/*.cjs'], rules: { 'no-console': 'off' } }
];
