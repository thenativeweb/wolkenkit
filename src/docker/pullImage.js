'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const pullImage = async function (options) {
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

  await shell.exec(`docker pull ${name}:${version}`, {
    env: environmentVariables
  });
};

module.exports = pullImage;
