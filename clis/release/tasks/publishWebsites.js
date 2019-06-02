'use strict';

const path = require('path');

const axios = require('axios'),
      buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell'),
      sleep = require('../../../common/utils/sleep');

const publishWebsites = async function ({ mode, versions, cwd }) {
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

  buntstift.header(`Publishing websites...`);

  if (mode !== 'release') {
    return buntstift.info('Skipping publication due to simulation mode.');
  }

  // This check must stay below the release mode check, as the new wolkenkit.io
  // version is only available when you are creating an actual release.
  if (!versions.wolkenkitIo) {
    throw new Error('wolkenkit.io version is missing.');
  }

  for (let i = 0; i < artefacts.kubernetes.length; i++) {
    const artefact = artefacts.kubernetes[i];

    const cwdKubernetes = path.join(cwd, artefact.repository);

    const wolkenkitIoFile = path.join(cwdKubernetes, 'applications', 'websites', 'wolkenkit.yaml');
    const wolkenkitIo = await files.read(wolkenkitIoFile);
    const newWolkenkitIo = wolkenkitIo.replace(/image: thenativeweb\/wolkenkit.io:\d+\.\d+\.\d+/ug, `image: thenativeweb/wolkenkit.io:${versions.wolkenkitIo}`);

    await files.write(wolkenkitIoFile, newWolkenkitIo);

    const wolkenkitDocumentationFile = path.join(cwdKubernetes, 'applications', 'websites', 'wolkenkit-documentation.yaml');
    const wolkenkitDocumentation = await files.read(wolkenkitDocumentationFile);
    const newWolkenkitDocumentation = wolkenkitDocumentation.replace(/image: thenativeweb\/wolkenkit-documentation:(?<version>\d+\.\d+\.\d+|latest)/ug, `image: thenativeweb/wolkenkit-documentation:${versions.wolkenkit}`);

    await files.write(wolkenkitDocumentationFile, newWolkenkitDocumentation);

    await shell.execLive('git add applications/websites/wolkenkit.yaml applications/websites/wolkenkit-documentation.yaml', { cwd: cwdKubernetes });
    await shell.execLive(`git commit -m 'Update websites.'`, { cwd: cwdKubernetes });
    await shell.execLive('git push', { cwd: cwdKubernetes });

    await shell.execLive('./03-apply.sh', { cwd: path.join(cwdKubernetes, 'applications', 'websites') });

    const documentationUrl = `https://docs.wolkenkit.io/${versions.wolkenkit}/`;

    /* eslint-disable no-constant-condition */
    while (true) {
      /* eslint-enable no-constant-condition */
      try {
        buntstift.info(`Fetching "${documentationUrl}"…`);
        await axios.get(documentationUrl);

        break;
      } catch {
        await sleep({ ms: 15 * 1000 });
      }
    }
  }
};

module.exports = publishWebsites;
