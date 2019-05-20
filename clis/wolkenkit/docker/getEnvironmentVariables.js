'use strict';

const hash = require('object-hash'),
      processenv = require('processenv');

const errors = require('../errors'),
      shell = require('../shell');

const cache = {};

const getEnvironmentVariables = async function ({ configuration }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }

  const cacheKey = `${hash({ ...configuration, containers: null })}-${configuration.environment}`;

  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  const environmentVariables = processenv();

  if (!configuration.docker || !configuration.docker.machine) {
    cache[cacheKey] = environmentVariables;

    return environmentVariables;
  }

  const { stdout } = await shell.exec(`docker-machine env --shell bash ${configuration.docker.machine}`);

  const matches = stdout.match(/^export .*$/ugm);

  if (!matches) {
    throw new errors.OutputMalformed();
  }

  matches.
    map(match => match.replace(/^export /u, '')).
    map(match => match.replace(/"/ug, '')).
    forEach(match => {
      const [ key, value ] = match.split('=');

      environmentVariables[key] = value;
    });

  cache[cacheKey] = environmentVariables;

  return environmentVariables;
};

module.exports = getEnvironmentVariables;
