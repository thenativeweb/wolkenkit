'use strict';

const docker = require('../../../docker'),
      errors = require('../../../errors');

const checkDocker = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { configuration, env } = options;

  const isInstalled = await docker.isInstalled();

  if (!isInstalled) {
    progress({ message: 'Docker client is not installed.', type: 'info' });
    throw new errors.ExecutableNotFound();
  }

  try {
    await docker.ping({ configuration, env });
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
