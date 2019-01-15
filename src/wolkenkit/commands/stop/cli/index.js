'use strict';

const docker = require('../../../../docker'),
      errors = require('../../../../errors'),
      health = require('../../health'),
      removeContainers = require('./removeContainers'),
      shared = require('../../shared');

const cli = async function ({
  directory,
  dangerouslyDestroyData,
  env,
  configuration
}, progress) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  await shared.checkDocker({ configuration, env }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  const existingContainers = await docker.getContainers({
    configuration,
    env,
    where: { label: { 'wolkenkit-application': configuration.application }}
  });

  progress({ message: 'Verifying application status...', type: 'info' });

  // We can not use the application status here, because for that we need to
  // fetch the labels of the containers. So this would be a chicken-and-egg
  // problem, hence this workaround.
  if (existingContainers.length === 0) {
    progress({ message: `The application is not running.`, type: 'info' });
    throw new errors.ApplicationNotRunning();
  }

  const dangerouslyExposeHttpPorts = existingContainers[0].labels['wolkenkit-dangerously-expose-http-ports'] === 'true',
        debug = existingContainers[0].labels['wolkenkit-debug'] === 'true',
        persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true',
        sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];

  const applicationStatus = await shared.getApplicationStatus({
    configuration,
    env,
    sharedKey,
    persistData,
    dangerouslyExposeHttpPorts,
    debug
  }, progress);

  if (applicationStatus === 'partially-running') {
    progress({ message: `The application is partially running.`, type: 'info' });
  }

  progress({ message: `Removing Docker containers...`, type: 'info' });
  await removeContainers({ configuration, env }, progress);

  progress({ message: `Removing network...`, type: 'info' });
  await docker.removeNetwork({ configuration, env });

  if (dangerouslyDestroyData) {
    progress({ message: 'Destroying previous data...', type: 'info' });
    await shared.destroyData({
      configuration,
      env,
      sharedKey,
      persistData,
      dangerouslyExposeHttpPorts,
      debug
    }, progress);
  }
};

module.exports = cli;
