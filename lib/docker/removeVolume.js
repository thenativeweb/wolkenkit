'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const removeVolume = async function ({ configuration, volume }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!volume) {
    throw new Error('Volume is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });

  await shell.exec(`docker volume rm --force ${volume.name}`, {
    env: environmentVariables
  });
};

module.exports = removeVolume;
