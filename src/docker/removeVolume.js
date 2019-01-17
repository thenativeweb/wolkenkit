'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const removeVolume = async function ({ configuration, name }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!name) {
    throw new Error('Name is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });

  await shell.exec(`docker volume rm --force ${name}`, {
    env: environmentVariables
  });
};

module.exports = removeVolume;
