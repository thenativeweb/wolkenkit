'use strict';

const runtimes = require('../../../runtimes'),
      shared = require('../../shared');

const list = async function ({ directory, env }, progress) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const configuration = await shared.getConfiguration({
    directory,
    env,
    isPackageJsonRequired: false
  }, progress);

  await shared.checkDocker({ configuration }, progress);

  const supportedVersions = await runtimes.getAllVersions();

  const installedVersions = [];

  await Promise.all(supportedVersions.map(async version => {
    const isInstalled = await runtimes.isInstalled({
      configuration,
      forVersion: version
    });

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

module.exports = list;
