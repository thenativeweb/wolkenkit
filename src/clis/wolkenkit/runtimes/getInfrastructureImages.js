'use strict';

const getImages = require('./getImages');

const getInfrastructureImages = async function ({ forVersion }) {
  if (!forVersion) {
    throw new Error('Version is missing.');
  }

  const images = await getImages({ forVersion });
  const infrastructureImages = images.filter(image => image.type === 'infrastructure');

  return infrastructureImages;
};

module.exports = getInfrastructureImages;
