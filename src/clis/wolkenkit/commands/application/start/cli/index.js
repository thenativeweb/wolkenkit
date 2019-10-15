'use strict';

const arrayToSentence = require('array-to-sentence'),
      noop = require('lodash/noop');

const attachDebugger = require('./attachDebugger'),
      buildImages = require('./buildImages'),
      docker = require('../../../../docker'),
      errors = require('../../../../errors'),
      health = require('../../../health'),
      install = require('../../../runtime/install'),
      runtimes = require('../../../../runtimes'),
      shared = require('../../../shared'),
      stop = require('../../stop'),
      verifyThatPortsAreAvailable = require('./verifyThatPortsAreAvailable');

const cli = async function ({
  configuration,
  dangerouslyExposeHttpPorts,
  debug,
  directory,
  env,
  port,
  privateKey
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
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
  const applicationStatus = await shared.getApplicationStatus({
    configuration,
    dangerouslyExposeHttpPorts,
    debug,
    secret
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
    secret
  }, progress);

  const runtimeVersion = configuration.application.runtime.version;

  if (await runtimes.getInstallationStatus({ configuration, forVersion: runtimeVersion }) !== 'installed') {
    progress({ message: `Installing wolkenkit ${runtimeVersion} on environment ${env}...`, type: 'info' });
    await install({ directory, env, version: runtimeVersion }, progress);
  }

  progress({ message: 'Setting up network...', type: 'info' });
  await docker.ensureNetworkExists({ configuration });

  progress({ message: 'Building Docker images...', type: 'info' });
  await buildImages({ configuration, directory }, progress);

  progress({ message: 'Starting Docker containers...', type: 'info' });
  const containers = await configuration.applicationContainers({
    dangerouslyExposeHttpPorts,
    debug,
    secret
  });

  await shared.startContainers({ configuration, containers }, progress);

  progress({ message: `Using ${secret} as secret.`, type: 'info' });

  try {
    await shared.waitForApplicationAndValidateLogs({ configuration }, progress);
  } catch (ex) {
    switch (ex.code) {
      case 'ERUNTIMEERROR':
        await stop({ directory, env, privateKey, port }, noop);
        break;
      default:
        break;
    }

    throw ex;
  }

  if (debug) {
    await attachDebugger({
      configuration,
      dangerouslyExposeHttpPorts,
      debug,
      secret
    }, progress);
  }

  const connections = await runtimes.getConnections({
    configuration,
    dangerouslyExposeHttpPorts,
    debug,
    forVersion: configuration.application.runtime.version,
    secret
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
