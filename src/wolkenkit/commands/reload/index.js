'use strict';

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      health = require('../health'),
      noop = require('../../../noop'),
      removeContainers = require('./removeContainers'),
      shared = require('../shared'),
      startContainers = require('./startContainers');

const reload = async function ({ directory, env }, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true
  }, progress);

  shared.validateCode({ directory }, progress);

  const environment = configuration.environments[env];

  if (environment.type === 'aufwind') {
    throw new Error('Reload on environment type aufwind is not possible.');
  }

  await shared.checkDocker({ configuration, env }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  progress({ message: 'Verifying application status...', type: 'info' });
  const existingContainers = await docker.getContainers({
    configuration,
    env,
    where: { label: { 'wolkenkit-application': configuration.application }}
  });

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
        port = Number(existingContainers[0].labels['wolkenkit-api-port']),
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
    throw new errors.ApplicationPartiallyRunning();
  }

  progress({ message: `Removing Docker containers...`, type: 'info' });
  await removeContainers({ configuration, env }, progress);

  progress({ message: 'Building Docker images...', type: 'info' });
  await shared.buildImages({ directory, configuration, env }, progress);

  progress({ message: 'Starting Docker containers...', type: 'info' });
  await startContainers({
    configuration,
    env,
    port,
    sharedKey,
    persistData,
    dangerouslyExposeHttpPorts,
    debug
  }, progress);

  progress({ message: `Using ${sharedKey} as shared key.`, type: 'info' });

  await shared.waitForApplicationAndValidateLogs({ configuration, env }, progress);

  if (debug) {
    await shared.attachDebugger({
      configuration,
      env,
      sharedKey,
      persistData,
      dangerouslyExposeHttpPorts,
      debug
    }, progress);
  }
};

module.exports = reload;
