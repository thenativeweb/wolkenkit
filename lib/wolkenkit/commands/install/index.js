'use strict';

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      noop = require('../../../noop'),
      runtimes = require('../../runtimes'),
      shared = require('../shared');

const install = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.version) {
    throw new Error('Version is missing.');
  }

  const { directory, env, version } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: false
  }, progress);

  await shared.checkDocker({ configuration, env }, progress);

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

  const installationStatus = await runtimes.getInstallationStatus({ configuration, env, forVersion: version });

  if (installationStatus === 'installed') {
    progress({ message: `wolkenkit ${version} is already installed.`, type: 'info' });

    throw new errors.RuntimeAlreadyInstalled();
  }

  await Promise.all(images.map(async image => {
    progress({ message: `Pulling ${image.name}:${image.version}...` });

    try {
      await docker.pullImage({ configuration, env, name: image.name, version: image.version });
    } catch (ex) {
      progress({ message: `Failed to pull ${image.name}:${image.version}.`, type: 'info' });

      throw ex;
    }

    progress({ message: `Pulled ${image.name}:${image.version}.`, type: 'info' });
  }));
};

module.exports = install;
