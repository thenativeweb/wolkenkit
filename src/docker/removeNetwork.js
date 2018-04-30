'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const removeNetwork = async function (options) {
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
  const name = `${configuration.application}-network`;

  const environmentVariables = await getEnvironmentVariables({ configuration, env });

  await shell.exec(`docker network rm "${name}"`, {
    env: environmentVariables
  });
};

module.exports = removeNetwork;
