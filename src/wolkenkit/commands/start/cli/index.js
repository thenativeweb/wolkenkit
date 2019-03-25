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
      verifyThatFileStorageIsAvailable = require('./verifyThatFileStorageIsAvailable'),
      verifyThatPortsAreAvailable = require('./verifyThatPortsAreAvailable');

const cli = async function ({
  configuration,
  dangerouslyDestroyData,
  dangerouslyExposeHttpPorts,
  debug,
  directory,
  env,
  persist,
  port,
  privateKey,
  sharedKey
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
  }
  if (dangerouslyExposeHttpPorts === undefined) {
    throw new Error('Dangerously expose http ports is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (persist === undefined) {
    throw new Error('Persist is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const sharedKeyByUser = sharedKey || processenv('WOLKENKIT_SHARED_KEY');
  const isSharedKeyGivenByUser = Boolean(sharedKeyByUser);

  if (persist && !isSharedKeyGivenByUser) {
    progress({ message: 'Shared key must be set when enabling persistence.', type: 'info' });
    throw new errors.SharedKeyMissing();
  }

  const actualSharedKey = sharedKeyByUser || await generateSharedKey();
  const persistData = persist;

  await shared.checkDocker({ configuration }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  progress({ message: 'Verifying application status...', type: 'info' });
  const applicationStatus = await shared.getApplicationStatus({
    configuration,
    dangerouslyExposeHttpPorts,
    debug,
    persistData,
    sharedKey: actualSharedKey
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
    configuration,
    dangerouslyExposeHttpPorts,
    debug,
    persistData,
    sharedKey: actualSharedKey
  }, progress);

  progress({ message: 'Verifying that file storage is available...', type: 'info' });
  await verifyThatFileStorageIsAvailable({ configuration }, progress);

  const runtimeVersion = configuration.application.runtime.version;

  if (await runtimes.getInstallationStatus({ configuration, forVersion: runtimeVersion }) !== 'installed') {
    progress({ message: `Installing wolkenkit ${runtimeVersion} on environment ${env}...`, type: 'info' });
    await install({ directory, env, version: runtimeVersion }, progress);
  }

  if (dangerouslyDestroyData) {
    progress({ message: 'Destroying previous data...', type: 'verbose' });
    await shared.destroyData({
      configuration,
      dangerouslyExposeHttpPorts,
      debug,
      persistData,
      sharedKey: actualSharedKey
    }, progress);
    progress({ message: 'Destroyed previous data.', type: 'warn' });
  }

  progress({ message: 'Setting up network...', type: 'info' });
  await docker.ensureNetworkExists({ configuration });

  progress({ message: 'Building Docker images...', type: 'info' });
  await shared.buildImages({ configuration, directory }, progress);

  progress({ message: 'Starting Docker containers...', type: 'info' });
  await startContainers({
    configuration,
    dangerouslyExposeHttpPorts,
    debug,
    persistData,
    sharedKey: actualSharedKey
  }, progress);

  progress({ message: `Using ${actualSharedKey} as shared key.`, type: 'info' });

  try {
    await shared.waitForApplicationAndValidateLogs({ configuration }, progress);
  } catch (ex) {
    switch (ex.code) {
      case 'ERUNTIMEERROR':
        await stop({
          dangerouslyDestroyData: false,
          directory,
          env,
          privateKey,
          port
        }, noop);
        break;
      default:
        break;
    }

    throw ex;
  }

  if (debug) {
    await shared.attachDebugger({
      configuration,
      dangerouslyExposeHttpPorts,
      debug,
      persistData,
      sharedKey: actualSharedKey
    }, progress);
  }

  const connections = await runtimes.getConnections({
    configuration,
    dangerouslyExposeHttpPorts,
    debug,
    forVersion: configuration.application.runtime.version,
    persistData,
    sharedKey: actualSharedKey
  });

  if (
    dangerouslyExposeHttpPorts &&
    connections.api.external.http &&
    connections.fileStorage.external.http
  ) {
    const httpPorts = [
      connections.api.external.http.port,
      connections.fileStorage.external.http.port
    ];

    progress({ message: `Exposed HTTP ports ${arrayToSentence(httpPorts)}.`, type: 'warn' });
  }
};

module.exports = cli;
