'use strict';

const path = require('path');

const eslint = require('eslint');

const errors = require('../../../errors');

const validateCode = function ({ directory }, progress) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const cliEngine = new eslint.CLIEngine({
    envs: [ 'node', 'es6' ],
    parserOptions: {
      ecmaVersion: 2017,
      ecmaFeatures: {}
    },
    rules: {
      'no-undef': 'error'
    },
    useEslintrc: false
  });

  const report = cliEngine.executeOnFiles([ path.join(directory, 'server', '**', '*.js') ]);

  if (report.errorCount === 0) {
    return;
  }

  const { errorCount, warningCount } = report;
  const problemCount = errorCount + warningCount;

  let message = '';

  message += `${problemCount} problem${problemCount !== 1 ? 's' : ''} `;
  message += `(${errorCount} error${errorCount !== 1 ? 's' : ''}, `;
  message += `${warningCount} warning${warningCount !== 1 ? 's' : ''})`;

  throw new errors.CodeMalformed(message, report);
};

module.exports = validateCode;
