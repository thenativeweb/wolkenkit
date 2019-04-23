'use strict';

const docker = require('../../../../docker'),
      errors = require('../../../../errors'),
      health = require('../../../health'),
      shared = require('../../../shared'),
      start = require('../../start'),
      stop = require('../../stop');

const cli = async function ({
  configuration,
  directory,
  env,
  privateKey = undefined
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  await shared.checkDocker({ configuration }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  progress({ message: 'Verifying infrastructure status...', type: 'info' });
  const existingInfrastructureContainers = await docker.getContainers({
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
  if (existingInfrastructureContainers.length === 0) {
    progress({ message: `The infrastructure is not running.`, type: 'info' });
    throw new errors.InfrastructureNotRunning();
  }

  const debugInfrastructure = existingInfrastructureContainers[0].labels['wolkenkit-debug'] === 'true',
        secret = existingInfrastructureContainers[0].labels['wolkenkit-secret'];

  const infrastructureStatus = await shared.getInfrastructureStatus({
    configuration,
    debug: debugInfrastructure,
    secret
  }, progress);

  if (infrastructureStatus === 'partially-running') {
    progress({ message: `The infrastructure is partially running.`, type: 'info' });
    throw new errors.InfrastructurePartiallyRunning();
  }

  progress({ message: 'Verifying application status...', type: 'info' });
  const existingApplicationContainers = await docker.getContainers({
    configuration,
    where: {
      label: {
        'wolkenkit-application': configuration.application.name,
        'wolkenkit-type': 'application'
      }
    }
  });

  if (existingApplicationContainers.length === 0) {
    progress({ message: `The application is not running.`, type: 'info' });
    throw new errors.ApplicationNotRunning();
  }

  const dangerouslyExposeHttpPorts = existingApplicationContainers[0].labels['wolkenkit-dangerously-expose-http-ports'] === 'true',
        debug = existingApplicationContainers[0].labels['wolkenkit-debug'] === 'true',
        port = Number(existingApplicationContainers[0].labels['wolkenkit-api-port']);

  progress({ message: `Stopping the application on environment ${env}...`, type: 'info' });
  await stop({
    directory,
    env,
    port,
    privateKey
  }, progress);

  progress({ message: `Starting the application on environment ${env}...`, type: 'info' });
  await start({
    directory,
    dangerouslyExposeHttpPorts,
    debug,
    env,
    port,
    privateKey,
    secret
  }, progress);
};

module.exports = cli;
