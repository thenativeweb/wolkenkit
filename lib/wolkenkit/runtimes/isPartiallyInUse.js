'use strict';

const getImages = require('./getImages'),
      getImagesInUse = require('./getImagesInUse');

const isPartiallyInUse = async function (options) {
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
  const imagesInUse = await getImagesInUse({ configuration, env, forVersion });

  const isRuntimePartiallyInUse = imagesInUse.length !== 0 && imagesInUse.length !== images.length;

  return isRuntimePartiallyInUse;
};

module.exports = isPartiallyInUse;
