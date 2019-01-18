'use strict';

const getImages = require('./getImages'),
      getMissingImages = require('./getMissingImages');

const isPartiallyInstalled = async function ({ configuration, forVersion }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!forVersion) {
    throw new Error('Version is missing.');
  }

  const images = await getImages({ forVersion });
  const missingImages = await getMissingImages({ configuration, forVersion });

  const isRuntimePartiallyInstalled =
    missingImages.length !== 0 &&
    missingImages.length !== images.length;

  return isRuntimePartiallyInstalled;
};

module.exports = isPartiallyInstalled;
