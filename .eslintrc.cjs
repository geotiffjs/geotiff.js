module.exports = {
  extends: 'airbnb-base',
  env: {
    mocha: true,
    browser: true,
    worker: true,
    node: true,
  },
  ignorePatterns: [
    'test/lib/**/*',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-underscore-dangle': 0,
    'class-methods-use-this': 0,
    'no-plusplus': 0,
    'no-loop-func': 0,
    'no-mixed-operators': [
      'error', {
        allowSamePrecedence: true,
      },
    ],
    'no-param-reassign': [
      'error', {
        props: false,
      },
    ],
    'no-prototype-builtins': 0,
    'no-restricted-syntax': [
      'error',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-console': 0,
    'no-bitwise': 0,
    'max-classes-per-file': 0,
    'max-len': ['error', { code: 130 }],
    'import/prefer-default-export': 0,
    'import/extensions': ['error', 'always'],
    'prefer-default-export': 0,
    'func-names': 0,
    'arrow-body-style': 0,
    'function-paren-newline': 0,
    'object-curly-newline': 0,
    'no-await-in-loop': 0,
    'prefer-destructuring': ['error', { object: true, array: false }],
    curly: ['error', 'all'],
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'no-else-return': 0,
  },
};
