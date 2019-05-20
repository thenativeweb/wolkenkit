'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      shell = require('../shell'),
      sleep = require('../../../common/utils/sleep');

const releaseArtefacts = async function ({ type, mode, releaseType, versions, cwd }) {
  if (!type) {
    throw new Error('Type is missing.');
  }
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

  buntstift.header(`Releasing ${type} images for wolkenkit ${versions.wolkenkit}...`);

  if (mode !== 'release') {
    return buntstift.info('Skipping release due to simulation mode.');
  }

  for (let i = 0; i < artefacts[type].length; i++) {
    const artefact = artefacts[type][i];

    const cwdArtefact = path.join(cwd, artefact.repository);

    await shell.execLive('git push', { cwd: cwdArtefact });
    await shell.execLive(`npx roboter release --type ${releaseType} --force`, { cwd: cwdArtefact });

    /* eslint-disable no-constant-condition */
    while (true) {
      /* eslint-enable no-constant-condition */
      try {
        await shell.execLive(`docker pull thenativeweb/${artefact.image}:${versions.wolkenkit}`, { cwd: cwdArtefact });

        break;
      } catch (ex) {
        if (!ex.message.includes('not found')) {
          throw ex;
        }

        await sleep({ ms: 15 * 1000 });
      }
    }
  }
};

module.exports = releaseArtefacts;
