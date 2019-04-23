'use strict';

const getMissingImages = require('./getMissingImages');

const isInstalled = async function ({ configuration, forVersion }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!forVersion) {
    throw new Error('Version is missing.');
  }

  const missingImages = await getMissingImages({ configuration, forVersion });
  const isRuntimeInstalled = missingImages.length === 0;

  return isRuntimeInstalled;
};

module.exports = isInstalled;
