'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const ensureNetworkExists = async function ({ configuration }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }

  const name = `${configuration.application.name}-network`;

  const environmentVariables = await getEnvironmentVariables({ configuration });

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
