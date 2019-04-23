'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      shell = require('../shell');

const releaseDocumentationSamples = async function ({ mode, releaseType, versions, cwd }) {
  if (!mode) {
    throw new Error('Mode is missing.');
  }
  if (!releaseType) {
    throw new Error('Release type is missing.');
  }
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

  buntstift.header('Releasing documentation samples...');

  if (mode !== 'release') {
    return buntstift.info('Skipping release due to simulation mode.');
  }

  for (let i = 0; i < artefacts.documentationSamples.length; i++) {
    const artefact = artefacts.documentationSamples[i];

    const cwdSample = path.join(cwd, artefact.repository);

    await shell.execLive('git push', { cwd: cwdSample });
    await shell.execLive(`git tag ${versions.wolkenkit}`, { cwd: cwdSample });
    await shell.execLive('git push --tags', { cwd: cwdSample });
  }
};

module.exports = releaseDocumentationSamples;
