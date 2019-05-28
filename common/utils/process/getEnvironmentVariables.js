'use strict';

const processenv = require('processenv');

const getEnvironmentVariables = function (requiredEnvironmentVariables) {
  if (!requiredEnvironmentVariables) {
    throw new Error('Required environment variables is missing.');
  }

  const environmentVariables = {};

  for (const [ name, defaultValue ] of Object.entries(requiredEnvironmentVariables)) {
    const value = processenv(name, defaultValue);

    if (value === undefined) {
      throw new Error(`Required environment variable '${name}' is not set.`);
    }

    environmentVariables[name] = value;
  }

  return environmentVariables;
};

module.exports = getEnvironmentVariables;
