'use strict';

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      health = require('../../health'),
      noop = require('../../../noop'),
      shared = require('../../shared');

const stop = async function ({
  dangerouslyDestroyData,
  directory,
  env,
  port = undefined
}, progress = noop) {
  if (dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }

  const configuration = await shared.getConfiguration({
    directory,
    env,
    isPackageJsonRequired: true,
    port
  }, progress);

  await shared.checkDocker({ configuration }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  progress({ message: 'Verifying infrastructure status...', type: 'info' });
  const existingContainers = await docker.getContainers({
    configuration,
    where: {
      label: {
        'wolkenkit-application': configuration.application.name,
        'wolkenkit-type': 'infrastructure'
      }
    }
  });

  // We can not use the infrastructure status here, because for that we need to
  // fetch the labels of the containers. So this would be a chicken-and-egg
  // problem, hence this workaround.
  if (existingContainers.length === 0) {
    progress({ message: `The infrastructure is not running.`, type: 'info' });
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
    progress({ message: `The infrastructure is partially running.`, type: 'info' });
  }

  progress({ message: `Removing Docker containers...`, type: 'info' });
  await shared.removeContainers({ configuration, containers: existingContainers }, progress);

  if (dangerouslyDestroyData) {
    progress({ message: 'Destroying previous data...', type: 'verbose' });
    await shared.destroyData({
      configuration,
      debug,
      secret
    }, progress);
    progress({ message: 'Destroyed previous data.', type: 'warn' });
  }
};

module.exports = stop;
