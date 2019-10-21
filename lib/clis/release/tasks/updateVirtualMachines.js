'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell');

const updateVirtualMachines = async function ({ versions, cwd }) {
  if (!versions) {
    throw new Error('Versions are missing.');
  }
  if (!versions.node) {
    throw new Error('Node.js version is missing.');
  }
  if (!versions.cli) {
    throw new Error('CLI version is missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Updating virtual machines...');

  for (let i = 0; i < artefacts.virtualMachines.length; i++) {
    const artefact = artefacts.virtualMachines[i];

    const cwdVirtualMachine = path.join(cwd, artefact.repository);

    const filename = path.join(cwdVirtualMachine, 'build.json');
    const buildJson = JSON.parse(await files.read(filename));

    /* eslint-disable camelcase */
    buildJson.variables.box_version = versions.cli;
    buildJson.variables.wolkenkit_cli_version = versions.cli;
    buildJson.variables.node_version = versions.node;
    /* eslint-enable camelcase */

    await files.write(filename, JSON.stringify(buildJson, null, 2));

    await shell.execLive('git add build.json', { cwd: cwdVirtualMachine });
    await shell.execLive(`git commit -m 'Update to wolkenkit CLI ${versions.cli}.'`, { cwd: cwdVirtualMachine });
  }
};

module.exports = updateVirtualMachines;
