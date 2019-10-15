'use strict';

const path = require('path');

const buntstift = require('buntstift'),
      semver = require('semver');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell');

const updateBaseImages = async function ({ versions, cwd }) {
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

  buntstift.header(`Updating base images to Node.js ${versions.node}...`);

  for (let i = 0; i < artefacts.base.length; i++) {
    const artefact = artefacts.base[i];

    const cwdBaseImage = path.join(cwd, artefact.repository);

    const fileName = path.join(cwdBaseImage, 'Dockerfile');
    const dockerfile = await files.read(fileName);

    const [ , currentVersion ] = /FROM node:(?<version>\d+\.\d+\.\d+)/ug.exec(dockerfile);

    const isRequestedNodeVersionTooOld = semver.lt(versions.node, currentVersion);
    const isRequestedNodeVersionNewer = semver.gt(versions.node, currentVersion);

    if (isRequestedNodeVersionTooOld) {
      throw new Error(`Requested Node.js version (${versions.node}) is older than current version (${currentVersion}).`);
    }

    if (isRequestedNodeVersionNewer) {
      const updatedDockerfile = dockerfile.replace(/FROM node:\d+\.\d+\.\d+/ug, `FROM node:${versions.node}`);

      await files.write(fileName, updatedDockerfile);

      await shell.execLive('git add Dockerfile', { cwd: cwdBaseImage });
      await shell.execLive(`git commit -m 'Update to Node.js ${versions.node}.'`, { cwd: cwdBaseImage });
    }

    await shell.execLive('npx roboter build', { cwd: cwdBaseImage });
    await shell.execLive(`docker tag thenativeweb/${artefact.image}:latest thenativeweb/${artefact.image}:${versions.wolkenkit}`, { cwd: cwdBaseImage });
  }
};

module.exports = updateBaseImages;
