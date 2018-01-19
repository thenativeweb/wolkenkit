'use strict';

const snakeCase = require('lodash/snakeCase');

const transformEnvironmentVariables = function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.environmentVariables) {
    throw new Error('Environment variables are missing.');
  }

  const { environmentVariables } = options;

  const result = {};

  Object.keys(environmentVariables).forEach(givenName => {
    const name = `WOLKENKIT_${snakeCase(givenName).toUpperCase()}`,
          value = environmentVariables[givenName];

    result[name] = value;
  });

  return result;
};

module.exports = transformEnvironmentVariables;
