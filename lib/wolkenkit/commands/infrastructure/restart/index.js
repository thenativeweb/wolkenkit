'use strict';

const docker = require('../../../../docker'),
      errors = require('../../../../errors'),
      health = require('../../health'),
      noop = require('../../../../noop'),
      shared = require('../../shared'),
      start = require('../start'),
      stop = require('../stop');

const restart = async function ({
  directory,
  dangerouslyDestroyData,
  env
}, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
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

  if (existingContainers.length === 0) {
    progress({ message: `The infrastructure is not running.`, type: 'info' });
    throw new errors.InfrastructureNotRunning();
  }

  const debug = existingContainers[0].labels['wolkenkit-debug'] === 'true',
        port = Number(existingContainers[0].labels['wolkenkit-api-port']),
        secret = existingContainers[0].labels['wolkenkit-secret'];

  progress({ message: `Stopping the infrastructure on environment ${env}...`, type: 'info' });
  await stop({ dangerouslyDestroyData, directory, env, port }, progress);

  progress({ message: `Starting the infrastructure on environment ${env}...`, type: 'info' });
  await start({
    directory,
    dangerouslyDestroyData: false,
    debug,
    env,
    port,
    secret
  }, progress);
};

module.exports = restart;
