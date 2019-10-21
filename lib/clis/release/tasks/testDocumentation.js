'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      shell = require('../shell');

const testDocumentation = async function ({ cwd }) {
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Testing documentation...');

  for (let i = 0; i < artefacts.documentation.length; i++) {
    const artefact = artefacts.documentation[i];

    await shell.execLive(`npx roboter`, { cwd: path.join(cwd, artefact.repository) });
    await shell.execLive(`npx roboter links`, { cwd: path.join(cwd, artefact.repository) });
  }
};

module.exports = testDocumentation;
