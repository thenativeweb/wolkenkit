'use strict';

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      health = require('../health'),
      noop = require('../../../noop'),
      shared = require('../shared');

const logs = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (options.follow === undefined) {
    throw new Error('Follow is missing.');
  }

  const { directory, env, follow } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true
  }, progress);

  await shared.checkDocker({ configuration, env }, progress);

  progress({ message: `Verifying health on environment ${env}...` });
  await health({ directory, env }, progress);

  const containers = await docker.getContainers({
    configuration,
    env,
    where: { label: { 'wolkenkit-application': configuration.application, 'wolkenkit-type': 'application' }}
  });

  if (containers.length === 0) {
    progress({ message: `The application is not running.`, type: 'info' });
    throw new errors.ApplicationNotRunning();
  }

  await docker.logs({ configuration, containers, env, follow });
};

module.exports = logs;
