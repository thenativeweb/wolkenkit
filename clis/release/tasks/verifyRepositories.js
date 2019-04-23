'use strict';

const buntstift = require('buntstift');

const artefacts = require('../artefacts');

const verifyRepositories = async function () {
  buntstift.header('Verifying the repositories...');

  for (const type of Object.keys(artefacts)) {
    if (type === 'all') {
      continue;
    }

    buntstift.list(type);

    for (let i = 0; i < artefacts[type].length; i++) {
      const artefact = artefacts[type][i];

      buntstift.list(artefact.repository, { indent: 1 });
    }

    buntstift.newLine();
  }

  buntstift.warn('Please verify that all of the repositories have been prepared and pushed to GitHub!');
  buntstift.newLine();

  const wereRepositoriesVerified = await buntstift.confirm('Did you verify the repositories?');

  if (!wereRepositoriesVerified) {
    throw new Error('Aborting because the repositories were not verified.');
  }
};

module.exports = verifyRepositories;
