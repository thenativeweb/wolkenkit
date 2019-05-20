'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell');

const updateWolkenkitIo = async function ({ versions, cwd }) {
  if (!versions) {
    throw new Error('Versions are missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Updating wolkenkit.io...');

  for (let i = 0; i < artefacts.website.length; i++) {
    const artefact = artefacts.website[i];

    const cwdWebsite = path.join(cwd, artefact.repository);

    const metadataFile = path.join(cwdWebsite, 'src', 'metadata.js');
    const metadata = await files.read(metadataFile);

    const newMetadata = metadata.replace(/wolkenkit: '\d+\.\d+\.\d+'/ug, `wolkenkit: '${versions.wolkenkit}'`);

    await files.write(metadataFile, newMetadata);

    await shell.execLive(`git add src/metadata.js`, { cwd: cwdWebsite });
    await shell.execLive(`git commit -m 'Update to wolkenkit ${versions.wolkenkit}.'`, { cwd: cwdWebsite });
  }
};

module.exports = updateWolkenkitIo;
