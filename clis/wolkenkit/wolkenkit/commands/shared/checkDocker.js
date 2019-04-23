'use strict';

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      runtimes = require('../../runtimes');

const checkDocker = async function ({ configuration }, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const isInstalled = await docker.isInstalled();

  if (!isInstalled) {
    const latestStableVersion = await runtimes.getLatestStableVersion();
    const wolkenkitUrl = `https://docs.wolkenkit.io/${latestStableVersion}/getting-started/installing-wolkenkit/verifying-system-requirements/`;

    progress({ message: `Docker client is not installed (see ${wolkenkitUrl} for how to install wolkenkit).`, type: 'info' });
    throw new errors.ExecutableNotFound();
  }

  try {
    await docker.ping({ configuration });
  } catch (ex) {
    switch (ex.code) {
      case 'EEXECUTABLEFAILED':
        progress({ message: ex.message });
        progress({ message: 'Failed to run Docker client.', type: 'info' });
        break;
      case 'EDOCKERNOTREACHABLE':
        progress({ message: 'Failed to reach Docker server.', type: 'info' });
        break;
      case 'EVERSIONMISMATCH':
        progress({ message: ex.message, type: 'info' });
        break;
      default:
        progress({ message: ex.message, type: 'info' });
    }

    throw ex;
  }
};

module.exports = checkDocker;
