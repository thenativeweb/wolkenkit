'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      shell = require('../shell');

const testCli = async function ({ cwd }) {
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Testing CLI...');

  for (let i = 0; i < artefacts.cli.length; i++) {
    const artefact = artefacts.cli[i];

    await shell.execLive(`npx roboter`, { cwd: path.join(cwd, artefact.repository) });
    await shell.execLive(`npx roboter test-stories`, { cwd: path.join(cwd, artefact.repository) });
  }
};

module.exports = testCli;
