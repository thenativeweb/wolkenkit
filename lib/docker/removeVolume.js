'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const removeVolume = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.name) {
    throw new Error('Name is missing.');
  }

  const { configuration, env, name } = options;

  const environmentVariables = await getEnvironmentVariables({ configuration, env });

  await shell.exec(`docker volume rm --force ${name}`, {
    env: environmentVariables
  });
};

module.exports = removeVolume;
