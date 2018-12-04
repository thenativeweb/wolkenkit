'use strict';

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
  Object.keys(environmentVariables).forEach(function (givenName) {
    var name = "WOLKENKIT_".concat(snakeCase(givenName).toUpperCase()),
        value = environmentVariables[givenName];
    result[name] = value;
  });
  return result;
};

module.exports = transformEnvironmentVariables;