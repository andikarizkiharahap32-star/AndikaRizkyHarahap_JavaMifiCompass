module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['web', 'admin', 'api', 'shared', 'ui', 'config', 'infra', 'docs', 'ci', 'deps']],
  },
};
