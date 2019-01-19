'use strict';

var snakeCase = require('lodash/snakeCase');

var transformEnvironmentVariables = function transformEnvironmentVariables(_ref) {
  var environmentVariables = _ref.environmentVariables;

  if (!environmentVariables) {
    throw new Error('Environment variables are missing.');
  }

  var result = {};
  Object.keys(environmentVariables).forEach(function (givenName) {
    var name = "WOLKENKIT_".concat(snakeCase(givenName).toUpperCase()),
        value = environmentVariables[givenName];
    result[name] = value;
  });
  return result;
};

module.exports = transformEnvironmentVariables;