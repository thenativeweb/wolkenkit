'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell');

const updateVagrantfile = async function ({ versions, cwd }) {
  if (!versions) {
    throw new Error('Versions are missing.');
  }
  if (!versions.cli) {
    throw new Error('CLI version is missing.');
  }
  if (!versions.vagrant) {
    throw new Error('Vagrant version is missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Updating Vagrantfile...');

  for (let i = 0; i < artefacts.vagrantfile.length; i++) {
    const artefact = artefacts.vagrantfile[i];

    const cwdVagrantfile = path.join(cwd, artefact.repository);

    const filename = path.join(cwdVagrantfile, 'Vagrantfile');
    const vagrantfile = await files.read(filename);

    /* eslint-disable camelcase */
    const newVagrantfile = vagrantfile.
      replace(/Vagrant.require_version ">= \d+\.\d+\.\d+"/ug, `Vagrant.require_version ">= ${versions.vagrant}"`).
      replace(/config.vm.box_version = "\d+\.\d+\.\d+"/ug, `config.vm.box_version = "${versions.cli}"`);
    /* eslint-enable camelcase */

    await files.write(filename, newVagrantfile);

    await shell.execLive('git add Vagrantfile', { cwd: cwdVagrantfile });
    await shell.execLive(`git commit -m 'Update to wolkenkit VM ${versions.cli}.'`, { cwd: cwdVagrantfile });
  }
};

module.exports = updateVagrantfile;
