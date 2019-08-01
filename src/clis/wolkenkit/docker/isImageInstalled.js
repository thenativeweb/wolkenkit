'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const isImageInstalled = async function ({ configuration, name, version }) {
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

  try {
    await shell.exec(`docker inspect --type=image ${name}:${version}`, {
      env: environmentVariables
    });
  } catch {
    return false;
  }

  return true;
};

module.exports = isImageInstalled;
