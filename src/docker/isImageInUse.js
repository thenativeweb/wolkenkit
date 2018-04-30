'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const isImageInUse = async function (options) {
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
  if (!options.version) {
    throw new Error('Version is missing.');
  }

  const { configuration, env, name, version } = options;

  const environmentVariables = await getEnvironmentVariables({ configuration, env });

  const { stdout } = await shell.exec(`docker ps -a -q --filter ancestor=${name}:${version}`, {
    env: environmentVariables
  });

  const isInUse = stdout !== '';

  return isInUse;
};

module.exports = isImageInUse;
