'use strict';

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      shell = require('../shell');

const cloneRepositories = async function ({ cwd }) {
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Cloning repositories...');

  for (let i = 0; i < artefacts.all.length; i++) {
    const artefact = artefacts.all[i];

    await shell.execLive(`git clone git@github.com:thenativeweb/${artefact.repository}.git`, { cwd });
  }
};

module.exports = cloneRepositories;
