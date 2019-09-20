'use strict';

const docker = require('../docker'),
      getImages = require('./getImages');

const getImagesInUse = async function ({ configuration, forVersion }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!forVersion) {
    throw new Error('Version is missing.');
  }

  const imagesInUse = [];
  const images = await getImages({ forVersion });

  for (const image of images) {
    const { name, version } = image;
    const isInstalled = await docker.isImageInstalled({
      configuration,
      name,
      version
    });

    if (!isInstalled) {
      continue;
    }

    const isInUse = await docker.isImageInUse({
      configuration,
      name,
      version
    });

    if (isInUse) {
      imagesInUse.push(image);
    }
  }

  return imagesInUse;
};

module.exports = getImagesInUse;
