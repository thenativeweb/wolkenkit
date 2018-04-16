'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const removeContainer = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.container) {
    throw new Error('Container is missing.');
  }

  const { configuration, env, container } = options;

  const environmentVariables = await getEnvironmentVariables({ configuration, env });

  await shell.exec(`docker rm --force --volumes "${container.name}"`, {
    env: environmentVariables
  });
};

module.exports = removeContainer;
