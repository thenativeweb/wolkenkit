'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const isImageInUse = async function ({ configuration, name, version }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!name) {
    throw new Error('Name is missing.');
  }
  if (!version) {
    throw new Error('Version is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });

  const { stdout } = await shell.exec(`docker ps -a -q --filter ancestor=${name}:${version}`, {
    env: environmentVariables
  });

  const isInUse = stdout !== '';

  return isInUse;
};

module.exports = isImageInUse;
