'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell');

const updateApplicationImages = async function ({ versions, cwd }) {
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

  buntstift.header(`Updating application images to Node.js base image ${versions.wolkenkit}...`);

  for (let i = 0; i < artefacts.application.length; i++) {
    const artefact = artefacts.application[i];

    const cwdApplicationImage = path.join(cwd, artefact.repository);

    const fileName = path.join(cwdApplicationImage, 'Dockerfile');
    const dockerfile = await files.read(fileName);

    const updatedDockerfile = dockerfile.replace(/FROM thenativeweb\/wolkenkit-box-node:\d+\.\d+\.\d+/ug, `FROM thenativeweb/wolkenkit-box-node:${versions.wolkenkit}`);

    await files.write(fileName, updatedDockerfile);

    await shell.execLive('git add Dockerfile', { cwd: cwdApplicationImage });
    await shell.execLive(`git commit -m 'Update base image to version ${versions.wolkenkit}.'`, { cwd: cwdApplicationImage });

    await shell.execLive('npx roboter build', { cwd: cwdApplicationImage });
    await shell.execLive(`docker tag thenativeweb/${artefact.image}:latest thenativeweb/${artefact.image}:${versions.wolkenkit}`, { cwd: cwdApplicationImage });
  }
};

module.exports = updateApplicationImages;
