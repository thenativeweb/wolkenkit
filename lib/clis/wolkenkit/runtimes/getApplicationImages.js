'use strict';

const getImages = require('./getImages');

const getApplicationImages = async function ({ forVersion }) {
  if (!forVersion) {
    throw new Error('Version is missing.');
  }

  const images = await getImages({ forVersion });
  const applicationImages = images.filter(image => image.type === 'application');

  return applicationImages;
};

module.exports = getApplicationImages;
