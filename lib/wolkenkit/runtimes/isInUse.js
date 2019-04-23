'use strict';

const getImages = require('./getImages'),
      getImagesInUse = require('./getImagesInUse');

const isInUse = async function ({ configuration, forVersion }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!forVersion) {
    throw new Error('Version is missing.');
  }

  const images = await getImages({ forVersion });
  const imagesInUse = await getImagesInUse({ configuration, forVersion });

  const isRuntimeInUse = imagesInUse.length === images.length;

  return isRuntimeInUse;
};

module.exports = isInUse;
