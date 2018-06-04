'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var snakeCase = require('lodash/snakeCase');

var transformEnvironmentVariables = function transformEnvironmentVariables(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.environmentVariables) {
    throw new Error('Environment variables are missing.');
  }

  var environmentVariables = options.environmentVariables;


  var result = {};

  (0, _keys2.default)(environmentVariables).forEach(function (givenName) {
    var name = 'WOLKENKIT_' + snakeCase(givenName).toUpperCase(),
        value = environmentVariables[givenName];

    result[name] = value;
  });

  return result;
};

module.exports = transformEnvironmentVariables;