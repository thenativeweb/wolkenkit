'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const buildImage = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.tag) {
    throw new Error('Tag is missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }

  const { configuration, env, tag, directory } = options;

  const environmentVariables = await getEnvironmentVariables({ configuration, env });

  await shell.exec(`docker build -t ${tag} ${directory}`, {
    env: environmentVariables
  });
};

module.exports = buildImage;
