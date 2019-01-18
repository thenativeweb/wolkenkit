'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const removeContainer = async function ({ configuration, container }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!container) {
    throw new Error('Container is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });

  await shell.exec(`docker rm --force --volumes "${container.name}"`, {
    env: environmentVariables
  });
};

module.exports = removeContainer;
