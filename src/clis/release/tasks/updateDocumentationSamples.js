'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell');

const updateDocumentationSamples = async function ({ versions, cwd }) {
  if (!versions) {
    throw new Error('Versions are missing.');
  }
  if (!versions.wolkenkit) {
    throw new Error('wolkenkit version is missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Updating documentation samples...');

  for (let i = 0; i < artefacts.documentationSamples.length; i++) {
    const artefact = artefacts.documentationSamples[i];

    const cwdSample = path.join(cwd, artefact.repository);

    const filename = path.join(cwdSample, 'package.json');
    const packageJson = JSON.parse(await files.read(filename));

    packageJson.version = versions.wolkenkit;
    packageJson.devDependencies['wolkenkit-client'] = versions.wolkenkit;

    await files.write(filename, JSON.stringify(packageJson, null, 2));

    await shell.execLive('git add package.json', { cwd: cwdSample });
    await shell.execLive(`git commit -m 'Update to wolkenkit SDK ${versions.wolkenkit}.'`, { cwd: cwdSample });
  }
};

module.exports = updateDocumentationSamples;
