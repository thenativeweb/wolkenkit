'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const removeNetwork = async function ({ configuration }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }

  const name = `${configuration.application.name}-network`;

  const environmentVariables = await getEnvironmentVariables({ configuration });

  await shell.exec(`docker network rm "${name}"`, {
    env: environmentVariables
  });
};

module.exports = removeNetwork;
