'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const pullImage = async function ({ configuration, name, version }) {
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

  await shell.exec(`docker pull ${name}:${version}`, {
    env: environmentVariables
  });
};

module.exports = pullImage;
