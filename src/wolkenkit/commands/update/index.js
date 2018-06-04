'use strict';

const semver = require('semver');

const errors = require('../../../errors'),
      noop = require('../../../noop'),
      npm = require('../../../npm');

const update = async function (progress = noop) {
  const packageName = 'wolkenkit';

  const installedVersion = await npm.getInstalledPackageVersion(packageName),
        latestVersion = await npm.getLatestPackageVersion(packageName);

  if (semver.eq(installedVersion, latestVersion)) {
    throw new errors.VersionAlreadyInstalled();
  }

  progress({ message: `Updating to version ${latestVersion}...`, type: 'info' });

  try {
    await npm.installPackage(packageName, latestVersion);
  } catch (ex) {
    progress({ message: 'npm failed to install.', type: 'info' });
    progress({ message: ex.stderr || ex.stdout });

    throw ex;
  }
};

module.exports = update;
