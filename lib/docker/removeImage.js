'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const removeImage = async function ({ configuration, name, version }) {
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

  await shell.exec(`docker rmi --force ${name}:${version}`, {
    env: environmentVariables
  });
};

module.exports = removeImage;
