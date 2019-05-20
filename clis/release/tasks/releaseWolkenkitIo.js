'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell'),
      sleep = require('../../../common/utils/sleep');

const releaseArtefacts = async function ({ mode, versions, cwd }) {
  if (!mode) {
    throw new Error('Mode is missing.');
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

  buntstift.header(`Releasing wolkenkit.io...`);

  if (mode !== 'release') {
    return buntstift.info('Skipping release due to simulation mode.');
  }

  for (let i = 0; i < artefacts.website.length; i++) {
    const artefact = artefacts.website[i];

    const cwdWebsite = path.join(cwd, artefact.repository);

    await shell.execLive('git push', { cwd: cwdWebsite });
    await shell.execLive(`npx roboter release --type minor --force`, { cwd: cwdWebsite });

    const packageJsonFile = path.join(cwdWebsite, 'package.json');
    const packageJson = JSON.parse(await files.read(packageJsonFile));

    /* eslint-disable no-param-reassign */
    versions.wolkenkitIo = packageJson.version;
    /* eslint-enable no-param-reassign */

    /* eslint-disable no-constant-condition */
    while (true) {
      /* eslint-enable no-constant-condition */
      try {
        await shell.execLive(`docker pull thenativeweb/${artefact.image}:${versions.wolkenkitIo}`, { cwd: cwdWebsite });

        return;
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
