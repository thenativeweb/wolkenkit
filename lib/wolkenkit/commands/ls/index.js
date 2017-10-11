'use strict';

const noop = require('../../../noop'),
      runtimes = require('../../runtimes'),
      shared = require('../shared');

const ls = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }

  const { directory, env } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: false
  }, progress);

  await shared.checkDocker({ configuration, env }, progress);

  const versions = await runtimes.getAllVersions();

  const installedVersions = [];

  await Promise.all(versions.map(async version => {
    const isInstalled = await runtimes.isInstalled({ configuration, env, forVersion: version });

    if (isInstalled) {
      installedVersions.push(version);
    }
  }));

  if (installedVersions.length === 0) {
    progress({ message: `No wolkenkit versions installed on environment ${env}.`, type: 'info' });
  } else {
    progress({ message: `Installed wolkenkit versions on environment ${env}:`, type: 'info' });

    // Iterate over the original array, as this is sorted, and it's easier to
    // do it this way than to sort installedVersions again (which would need to
    // be done using semver).
    versions.forEach(version => {
      if (!installedVersions.includes(version)) {
        return;
      }
      progress({ message: version, type: 'list' });
    });
  }
};

module.exports = ls;
