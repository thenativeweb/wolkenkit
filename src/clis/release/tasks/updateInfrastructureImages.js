'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      shell = require('../shell');

const updateInfrastructureImages = async function ({ versions, cwd }) {
  if (!versions) {
    throw new Error('Versions are missing.');
  }
  if (!versions.node) {
    throw new Error('Node.js version is missing.');
  }
  if (!versions.wolkenkit) {
    throw new Error('wolkenkit version is missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Updating infrastructure images...');

  for (let i = 0; i < artefacts.infrastructure.length; i++) {
    const artefact = artefacts.infrastructure[i];

    const cwdInfrastructureImage = path.join(cwd, artefact.repository);

    await shell.execLive('npx roboter build', { cwd: cwdInfrastructureImage });
    await shell.execLive(`docker tag thenativeweb/${artefact.image}:latest thenativeweb/${artefact.image}:${versions.wolkenkit}`, { cwd: cwdInfrastructureImage });
  }
};

module.exports = updateInfrastructureImages;
