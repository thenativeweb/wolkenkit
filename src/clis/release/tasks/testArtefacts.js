'use strict';

const path = require('path');

const buntstift = require('buntstift'),
      processenv = require('processenv');

const artefacts = require('../artefacts'),
      shell = require('../shell');

const testArtefacts = async function ({ type, cwd }) {
  if (!type) {
    throw new Error('Type is missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header(`Testing ${type} artefacts...`);

  for (let i = 0; i < artefacts[type].length; i++) {
    const artefact = artefacts[type][i];

    await shell.execLive(`npx roboter`, {
      cwd: path.join(cwd, artefact.repository),
      env: {
        ...processenv(),
        SELENIUM_ENV: 'browserstack'
      }
    });
  }
};

module.exports = testArtefacts;
