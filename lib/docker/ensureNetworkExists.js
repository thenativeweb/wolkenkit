'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const ensureNetworkExists = async function (options) {
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

  const { stdout } = await shell.exec(`docker network ls --format "{{json .}}"`, {
    env: environmentVariables
  });

  const networks = stdout.
    split('\n').
    filter(item => item).
    map(item => JSON.parse(item));

  const doesNetworkExist = networks.find(network => network.Name === name);

  if (doesNetworkExist) {
    return;
  }

  await shell.exec(`docker network create ${name}`, {
    env: environmentVariables
  });
};

module.exports = ensureNetworkExists;
