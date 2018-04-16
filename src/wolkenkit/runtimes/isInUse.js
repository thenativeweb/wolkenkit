'use strict';

const getImages = require('./getImages'),
      getImagesInUse = require('./getImagesInUse');

const isInUse = async function (options) {
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

  const isRuntimeInUse = imagesInUse.length === images.length;

  return isRuntimeInUse;
};

module.exports = isInUse;
