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

  const supportedVersions = await runtimes.getAllVersions();

  const installedVersions = [];

  await Promise.all(supportedVersions.map(async version => {
    const isInstalled = await runtimes.isInstalled({ configuration, env, forVersion: version });

    if (isInstalled) {
      installedVersions.push(version);
    }
  }));

  supportedVersions.forEach(version => {
    if (installedVersions.includes(version)) {
      return progress({ message: `${version} (installed)`, type: 'list' });
    }

    progress({ message: version, type: 'list' });
  });

  return { supported: supportedVersions, installed: installedVersions };
};

module.exports = ls;
