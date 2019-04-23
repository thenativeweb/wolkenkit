'use strict';

const docker = require('../../../../docker'),
      errors = require('../../../../errors'),
      health = require('../../health'),
      noop = require('../../../../noop'),
      shared = require('../../shared');

const status = async function ({
  directory,
  env
}, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }

  const configuration = await shared.getConfiguration({
    directory,
    env,
    isPackageJsonRequired: true
  }, progress);

  await shared.checkDocker({ configuration }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  const existingContainers = await docker.getContainers({
    configuration,
    where: {
      label: {
        'wolkenkit-application': configuration.application.name,
        'wolkenkit-type': 'infrastructure'
      }
    }
  });

  progress({ message: 'Verifying infrastructure status...', type: 'info' });

  // We can not use the infrastructure status here, because for that we need to
  // fetch the labels of the containers. So this would be a chicken-and-egg
  // problem, hence this workaround.
  if (existingContainers.length === 0) {
    throw new errors.InfrastructureNotRunning();
  }

  const debug = existingContainers[0].labels['wolkenkit-debug'] === 'true',
        secret = existingContainers[0].labels['wolkenkit-secret'];

  const infrastructureStatus = await shared.getInfrastructureStatus({
    configuration,
    debug,
    secret
  }, progress);

  if (infrastructureStatus === 'partially-running') {
    throw new errors.InfrastructurePartiallyRunning();
  }

  progress({ message: `Using ${secret} as secret.`, type: 'info' });
};

module.exports = status;
