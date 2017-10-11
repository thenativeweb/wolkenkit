'use strict';

const getImages = require('./getImages'),
      getMissingImages = require('./getMissingImages');

const isPartiallyInstalled = async function (options) {
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

  const images = await getImages({ forVersion });
  const missingImages = await getMissingImages({ configuration, env, forVersion });

  const isRuntimePartiallyInstalled = missingImages.length !== 0 && missingImages.length !== images.length;

  return isRuntimePartiallyInstalled;
};

module.exports = isPartiallyInstalled;
