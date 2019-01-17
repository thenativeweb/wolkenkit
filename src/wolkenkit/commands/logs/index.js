'use strict';

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      health = require('../health'),
      shared = require('../shared');

const logs = async function ({ directory, env, follow }, progress) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (follow === undefined) {
    throw new Error('Follow is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const configuration = await shared.getConfiguration({
    directory,
    env,
    isPackageJsonRequired: true
  }, progress);

  await shared.checkDocker({ configuration }, progress);

  progress({ message: `Verifying health on environment ${env}...` });
  await health({ directory, env }, progress);

  const containers = await docker.getContainers({
    configuration,
    where: {
      label: {
        'wolkenkit-application': configuration.application.name,
        'wolkenkit-type': 'application'
      }
    }
  });

  if (containers.length === 0) {
    progress({ message: `The application is not running.`, type: 'info' });
    throw new errors.ApplicationNotRunning();
  }

  await docker.logs({ configuration, containers, follow });
};

module.exports = logs;
