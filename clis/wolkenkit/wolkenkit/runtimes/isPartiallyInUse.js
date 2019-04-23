'use strict';

const getImages = require('./getImages'),
      getImagesInUse = require('./getImagesInUse');

const isPartiallyInUse = async function ({ configuration, forVersion }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!forVersion) {
    throw new Error('Version is missing.');
  }

  const images = await getImages({ forVersion });
  const imagesInUse = await getImagesInUse({ configuration, forVersion });

  const isRuntimePartiallyInUse =
    imagesInUse.length !== 0 &&
    imagesInUse.length !== images.length;

  return isRuntimePartiallyInUse;
};

module.exports = isPartiallyInUse;
