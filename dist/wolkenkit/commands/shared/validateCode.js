'use strict';

var path = require('path');

var eslint = require('eslint');

var errors = require('../../../errors');

var validateCode = function validateCode(_ref, progress) {
  var directory = _ref.directory;

  if (!directory) {
    throw new Error('Directory is missing.');
  }

  if (!progress) {
    throw new Error('Progress is missing.');
  }

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
  message += "".concat(problemCount, " problem").concat(problemCount !== 1 ? 's' : '', " ");
  message += "(".concat(errorCount, " error").concat(errorCount !== 1 ? 's' : '', ", ");
  message += "".concat(warningCount, " warning").concat(warningCount !== 1 ? 's' : '', ")");
  throw new errors.CodeMalformed(message, report);
};

module.exports = validateCode;