'use strict';

const snakeCase = require('lodash/snakeCase');

const transformEnvironmentVariables = function ({ environmentVariables }) {
  if (!environmentVariables) {
    throw new Error('Environment variables are missing.');
  }

  const result = {};

  Object.keys(environmentVariables).forEach(givenName => {
    const name = `WOLKENKIT_${snakeCase(givenName).toUpperCase()}`,
          value = environmentVariables[givenName];

    result[name] = value;
  });

  return result;
};

module.exports = transformEnvironmentVariables;
