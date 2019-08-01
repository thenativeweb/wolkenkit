'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell');

const releaseVirtualMachines = async function ({ mode, versions, cwd }) {
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

  buntstift.header('Releasing virtual machines...');

  for (let i = 0; i < artefacts.virtualMachines.length; i++) {
    const artefact = artefacts.virtualMachines[i];

    const cwdVirtualMachine = path.join(cwd, artefact.repository);

    if (mode !== 'release') {
      buntstift.info('Skipping release due to simulation mode.');

      const filename = path.join(cwdVirtualMachine, 'build.json');
      const buildJson = await files.readJson(filename);

      const index = buildJson['post-processors'][0].
        findIndex(postProcessor => postProcessor.type === 'vagrant-cloud');

      if (index === -1) {
        throw new Error('Section post-processors.vagrant-cloud is missing.');
      }

      buildJson['post-processors'][0].splice(index, 1);

      await files.writeJson(filename, buildJson);

      try {
        await shell.execLive('packer build build.json', { cwd: cwdVirtualMachine });
      } catch (ex) {
        if (
          ex.code === 1 &&
          ex.stdout &&
          ex.stdout.includes(`npm ERR! notarget No matching version found for wolkenkit@${versions.cli}`)
        ) {
          continue;
        }

        throw ex;
      }
    }

    await shell.execLive('git push', { cwd: cwdVirtualMachine });
    await shell.execLive(`git tag ${versions.cli}`, { cwd: cwdVirtualMachine });
    await shell.execLive('git push --tags', { cwd: cwdVirtualMachine });

    await shell.execLive('packer build build.json', { cwd: cwdVirtualMachine });
  }
};

module.exports = releaseVirtualMachines;
