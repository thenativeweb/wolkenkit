'use strict';

const processenv = require('processenv');

const errors = require('../errors'),
      shell = require('../shell');

const getEnvironmentVariables = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }

  const { configuration, env } = options;

  const environment = configuration.environments[env];

  if (!environment) {
    throw new errors.EnvironmentNotFound();
  }

  const environmentVariables = processenv();

  if (!environment.docker || !environment.docker.machine) {
    return environmentVariables;
  }

  const { stdout } = await shell.exec(`docker-machine env --shell bash ${environment.docker.machine}`);

  const matches = stdout.match(/^export .*$/gm);

  if (!matches) {
    throw new errors.OutputMalformed();
  }

  matches.
    map(match => match.replace(/^export /, '')).
    map(match => match.replace(/"/g, '')).
    forEach(match => {
      const [ key, value ] = match.split('=');

      environmentVariables[key] = value;
    });

  return environmentVariables;
};

module.exports = getEnvironmentVariables;
