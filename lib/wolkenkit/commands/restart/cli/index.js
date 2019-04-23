'use strict';

const docker = require('../../../../docker'),
      errors = require('../../../../errors'),
      health = require('../../health'),
      shared = require('../../shared'),
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

  progress({ message: 'Verifying application status...', type: 'info' });
  const existingContainers = await docker.getContainers({
    configuration,
    where: { label: { 'wolkenkit-application': configuration.application.name }}
  });

  if (existingContainers.length === 0) {
    progress({ message: `The application is not running.`, type: 'info' });
    throw new errors.ApplicationNotRunning();
  }

  const dangerouslyExposeHttpPorts = existingContainers[0].labels['wolkenkit-dangerously-expose-http-ports'] === 'true',
        debug = existingContainers[0].labels['wolkenkit-debug'] === 'true',
        persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true',
        port = Number(existingContainers[0].labels['wolkenkit-api-port']),
        sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];

  progress({ message: `Stopping the application on environment ${env}...`, type: 'info' });
  await stop({
    dangerouslyDestroyData: false,
    directory,
    env,
    port,
    privateKey
  }, progress);

  progress({ message: `Starting the application on environment ${env}...`, type: 'info' });
  await start({
    directory,
    dangerouslyDestroyData: false,
    dangerouslyExposeHttpPorts,
    debug,
    env,
    persist: persistData,
    port,
    privateKey,
    sharedKey
  }, progress);
};

module.exports = cli;
