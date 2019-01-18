'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const buildImage = async function ({ configuration, directory, tag }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!tag) {
    throw new Error('Tag is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });

  await shell.exec(`docker build -t ${tag} ${directory}`, {
    env: environmentVariables
  });
};

module.exports = buildImage;
