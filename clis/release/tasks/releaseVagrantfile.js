'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      shell = require('../shell');

const releaseVagrantfile = async function ({ mode, versions, cwd }) {
  if (!mode) {
    throw new Error('Mode is missing.');
  }
  if (!versions) {
    throw new Error('Versions are missing.');
  }
  if (!versions.cli) {
    throw new Error('CLI version is missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Releasing Vagrantfile...');

  if (mode !== 'release') {
    return buntstift.info('Skipping release due to simulation mode.');
  }

  for (let i = 0; i < artefacts.vagrantfile.length; i++) {
    const artefact = artefacts.vagrantfile[i];

    const cwdVagrantfile = path.join(cwd, artefact.repository);

    await shell.execLive('git push', { cwd: cwdVagrantfile });
    await shell.execLive(`git tag ${versions.cli}`, { cwd: cwdVagrantfile });
    await shell.execLive('git push --tags', { cwd: cwdVagrantfile });
  }
};

module.exports = releaseVagrantfile;
