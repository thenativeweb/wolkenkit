'use strict';

const docker = require('../../docker'),
      getImages = require('./getImages');

const getImagesInUse = async function (options) {
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

  const imagesInUse = [];
  const images = await getImages({ forVersion });

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    const { name, version } = image;
    const isInstalled = await docker.isImageInstalled({ configuration, env, name, version });

    if (!isInstalled) {
      continue;
    }

    const isInUse = await docker.isImageInUse({ configuration, env, name, version });

    if (isInUse) {
      imagesInUse.push(image);
    }
  }

  return imagesInUse;
};

module.exports = getImagesInUse;
