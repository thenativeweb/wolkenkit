'use strict';

const fs = require('fs'),
      path = require('path'),
      { promisify } = require('util');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell');

const readdir = promisify(fs.readdir),
      stat = promisify(fs.stat);

const updateDocker = async function ({ directory, versions }) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!versions) {
    throw new Error('Versions are missing.');
  }

  const dockerFile = path.join(directory, 'docker.js');
  const data = await files.read(dockerFile);

  const newData = data.replace(/minimumVersion: '\d{2}\.\d{2}'/ug, `minimumVersion: '${versions.docker}'`);

  await files.write(dockerFile, newData);
};

const updateCli = async function ({ versions, cwd }) {
  if (!versions) {
    throw new Error('Versions are missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Updating CLI...');

  for (let i = 0; i < artefacts.cli.length; i++) {
    const artefact = artefacts.cli[i];

    const cwdCli = path.join(cwd, artefact.repository);

    const source = `${path.join(cwdCli, 'src', 'configuration', 'latest')}`;
    const destination = `${path.join(cwdCli, 'src', 'configuration', versions.wolkenkit)}`;

    await shell.copyDirectory({ source, destination });

    const entries = await readdir(destination);

    for (let j = 0; j < entries.length; j++) {
      const entry = path.join(destination, entries[j]);
      const stats = await stat(entry);

      if (!stats.isDirectory()) {
        continue;
      }

      const imageFile = path.join(entry, 'image.js');
      const data = await files.read(imageFile);

      const newData = data.replace(`version: 'latest'`, `version: '${versions.wolkenkit}'`);

      await files.write(imageFile, newData);
    }

    // Update the minimum Docker version in `latest` as well as in the new
    // version, hence we need to update it in source *and* destination.
    updateDocker({ directory: source, versions });
    updateDocker({ directory: destination, versions });

    const latestTestsFile = path.join(cwdCli, 'test', 'stories', 'applicationLifecycle-latest-Tests.js');
    const latestTests = await files.read(latestTestsFile);

    const versionTestsFile = path.join(cwdCli, 'test', 'stories', `applicationLifecycle-${versions.wolkenkit}-Tests.js`);
    const versionTests = latestTests.replace('latest', versions.wolkenkit);

    await files.write(versionTestsFile, versionTests);

    await shell.execLive(`git add src/configuration/latest src/configuration/${versions.wolkenkit} test/stories/applicationLifecycle-${versions.wolkenkit}-Tests.js`, { cwd: cwdCli });
    await shell.execLive(`git commit -m 'Add support for wolkenkit ${versions.wolkenkit}.'`, { cwd: cwdCli });
  }
};

module.exports = updateCli;
