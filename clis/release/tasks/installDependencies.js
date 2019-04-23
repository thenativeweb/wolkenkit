'use strict';

const path = require('path');

const buntstift = require('buntstift');

const artefacts = require('../artefacts'),
      files = require('../files'),
      shell = require('../shell');

const cloneRepositories = async function ({ cwd }) {
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Installing dependencies...');

  for (let i = 0; i < artefacts.all.length; i++) {
    const artefact = artefacts.all[i];
    const cwdArtefact = path.join(cwd, artefact.repository);

    const packageJson = path.join(cwdArtefact, 'package.json');
    const packageLockJson = path.join(cwdArtefact, 'package-lock.json');

    if (!await files.exists(packageJson)) {
      continue;
    }

    if (await files.exists(packageLockJson)) {
      await shell.execLive('rm package-lock.json', { cwd: cwdArtefact });
    }

    await shell.execLive('npm install', { cwd: cwdArtefact });

    const { code } = await shell.exec('git diff --exit-code --quiet package-lock.json', { cwd: cwdArtefact });

    if (code === 0) {
      // The package-lock.json file was not added or updated, so just continue
      // with the next iteration.
      continue;
    }

    if (code === 1) {
      await shell.execLive('git add package-lock.json', { cwd: cwdArtefact });
      await shell.execLive(`git commit -m 'Update dependencies.'`, { cwd: cwdArtefact });

      continue;
    }

    throw new Error('Failed to verify git status.');
  }
};

module.exports = cloneRepositories;
