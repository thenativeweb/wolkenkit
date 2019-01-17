'use strict';

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      noop = require('../../../noop'),
      runtimes = require('../../runtimes'),
      shared = require('../shared');

const uninstall = async function ({
  directory,
  env,
  version
}, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!version) {
    throw new Error('Version is missing.');
  }

  const configuration = await shared.getConfiguration({
    directory,
    env,
    isPackageJsonRequired: false
  }, progress);

  await shared.checkDocker({ configuration }, progress);

  let images;

  try {
    images = await runtimes.getImages({ forVersion: version });
  } catch (ex) {
    switch (ex.code) {
      case 'EVERSIONNOTFOUND':
        progress({ message: 'Version does not exist.', type: 'info' });
        break;
      default:
        progress({ message: ex.message, type: 'info' });
    }

    throw ex;
  }

  const installationStatus = await runtimes.getInstallationStatus({
    configuration,
    forVersion: version
  });

  if (installationStatus === 'not-installed') {
    progress({ message: `wolkenkit ${version} is not installed.`, type: 'info' });

    throw new errors.RuntimeNotInstalled();
  }

  const usageStatus = await runtimes.getUsageStatus({
    configuration,
    forVersion: version
  });

  if (usageStatus === 'used' || usageStatus === 'partially-used') {
    progress({ message: `wolkenkit ${version} is being used.`, type: 'info' });

    throw new errors.RuntimeInUse();
  }

  const missingImages = await runtimes.getMissingImages({
    configuration,
    forVersion: version
  });

  await Promise.all(images.map(async image => {
    progress({ message: `Deleting ${image.name}:${image.version}...` });

    if (missingImages.find(missingImage => missingImage.name === image.name)) {
      progress({ message: `Image ${image.name}:${image.version} is not installed.` });

      return;
    }

    try {
      await docker.removeImage({
        configuration,
        name: image.name,
        version: image.version
      });
    } catch (ex) {
      progress({ message: `Failed to delete ${image.name}:${image.version}.`, type: 'info' });

      throw ex;
    }

    progress({ message: `Deleted ${image.name}:${image.version}.`, type: 'info' });
  }));
};

module.exports = uninstall;
