'use strict';

var path = require('path');

var eslint = require('eslint');

var errors = require('../../../errors');

var validateCode = function validateCode(options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  var directory = options.directory;


  var cliEngine = new eslint.CLIEngine({
    envs: ['node', 'es6'],
    parserOptions: {
      ecmaVersion: 2017,
      ecmaFeatures: {}
    },
    rules: {
      'no-undef': 'error'
    },
    useEslintrc: false
  });

  var report = cliEngine.executeOnFiles([path.join(directory, 'server', '**', '*.js')]);

  if (report.errorCount === 0) {
    return;
  }

  var errorCount = report.errorCount,
      warningCount = report.warningCount;

  var problemCount = errorCount + warningCount;

  var message = '';

  message += problemCount + ' problem' + (problemCount !== 1 ? 's' : '') + ' ';
  message += '(' + errorCount + ' error' + (errorCount !== 1 ? 's' : '') + ', ';
  message += warningCount + ' warning' + (warningCount !== 1 ? 's' : '') + ')';

  throw new errors.CodeMalformed(message, report);
};

module.exports = validateCode;