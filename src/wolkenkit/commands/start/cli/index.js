'use strict';

const arrayToSentence = require('array-to-sentence'),
      processenv = require('processenv');

const docker = require('../../../../docker'),
      errors = require('../../../../errors'),
      generateSharedKey = require('./generateSharedKey'),
      health = require('../../health'),
      install = require('../../install'),
      noop = require('../../../../noop'),
      runtimes = require('../../../runtimes'),
      shared = require('../../shared'),
      startContainers = require('./startContainers'),
      stop = require('../../stop'),
      verifyThatPortsAreAvailable = require('./verifyThatPortsAreAvailable');

const cli = async function ({
  directory,
  dangerouslyDestroyData,
  dangerouslyExposeHttpPort,
  debug,
  env,
  configuration,
  persist,
  port,
  sharedKey
}, progress) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
  }
  if (dangerouslyExposeHttpPort === undefined) {
    throw new Error('Dangerously expose http port is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (persist === undefined) {
    throw new Error('Persist is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const environment = configuration.environments[env];

  // Set the port within the configuration to the correct value (flag over
  // environment variable over default value from the package.json file).
  environment.api.address.port =
    port ||
    processenv('WOLKENKIT_PORT') ||
    environment.api.address.port;

  const runtimeVersion = configuration.runtime.version;

  const sharedKeyByUser = sharedKey || processenv('WOLKENKIT_SHARED_KEY');
  const isSharedKeyGivenByUser = Boolean(sharedKeyByUser);

  if (persist && !isSharedKeyGivenByUser) {
    progress({ message: 'Shared key must be set when enabling persistence.', type: 'info' });
    throw new errors.SharedKeyMissing();
  }

  const actualSharedKey = sharedKeyByUser || await generateSharedKey();
  const persistData = persist;

  await shared.checkDocker({ configuration, env }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  progress({ message: 'Verifying application status...', type: 'info' });
  const applicationStatus = await shared.getApplicationStatus({
    configuration,
    env,
    sharedKey: actualSharedKey,
    persistData,
    dangerouslyExposeHttpPort,
    debug
  }, progress);

  if (applicationStatus === 'running') {
    progress({ message: `The application is already running.`, type: 'info' });
    throw new errors.ApplicationAlreadyRunning();
  }
  if (applicationStatus === 'partially-running') {
    progress({ message: `The application is partially running.`, type: 'info' });
    throw new errors.ApplicationPartiallyRunning();
  }

  progress({ message: 'Verifying that ports are available...', type: 'info' });
  await verifyThatPortsAreAvailable({
    forVersion: runtimeVersion,
    configuration,
    env,
    sharedKey: actualSharedKey,
    persistData,
    dangerouslyExposeHttpPort,
    debug
  }, progress);

  if (await runtimes.getInstallationStatus({ configuration, env, forVersion: runtimeVersion }) !== 'installed') {
    progress({ message: `Installing wolkenkit ${runtimeVersion} on environment ${env}...`, type: 'info' });
    await install({ directory, env, version: runtimeVersion }, progress);
  }

  if (dangerouslyDestroyData) {
    progress({ message: 'Destroying previous data...', type: 'info' });
    await shared.destroyData({
      configuration,
      env,
      sharedKey: actualSharedKey,
      persistData,
      dangerouslyExposeHttpPort,
      debug
    }, progress);
  }

  progress({ message: 'Setting up network...', type: 'info' });
  await docker.ensureNetworkExists({ configuration, env });

  progress({ message: 'Building Docker images...', type: 'info' });
  await shared.buildImages({ directory, configuration, env }, progress);

  progress({ message: 'Starting Docker containers...', type: 'info' });
  await startContainers({
    configuration,
    env,
    port: environment.api.address.port,
    sharedKey: actualSharedKey,
    persistData,
    dangerouslyExposeHttpPort,
    debug
  }, progress);

  progress({ message: `Using ${actualSharedKey} as shared key.`, type: 'info' });

  try {
    await shared.waitForApplicationAndValidateLogs({ configuration, env }, progress);
  } catch (ex) {
    switch (ex.code) {
      case 'ERUNTIMEERROR':
        await stop({ directory, dangerouslyDestroyData: false, env, configuration }, noop);
        break;
      default:
        break;
    }

    throw ex;
  }

  if (debug) {
    await shared.attachDebugger({
      configuration,
      env,
      sharedKey: actualSharedKey,
      persistData,
      dangerouslyExposeHttpPort,
      debug
    }, progress);
  }

  if (dangerouslyExposeHttpPort) {
    const httpPorts = [
      environment.api.address.port + 10,
      environment.api.address.port + 11
    ];

    progress({ message: `Dangerously exposed HTTP ports on ${arrayToSentence(httpPorts)}.`, type: 'warn' });
  }
};

module.exports = cli;
