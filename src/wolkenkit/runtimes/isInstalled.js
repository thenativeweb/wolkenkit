'use strict';

const getMissingImages = require('./getMissingImages');

const isInstalled = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.forVersion) {
    throw new Error('Version is missing.');
  }

  const { configuration, env, forVersion } = options;

  const missingImages = await getMissingImages({ configuration, env, forVersion });
  const isRuntimeInstalled = missingImages.length === 0;

  return isRuntimeInstalled;
};

module.exports = isInstalled;
