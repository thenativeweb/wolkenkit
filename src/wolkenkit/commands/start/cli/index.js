'use strict';

const processenv = require('processenv');

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

const cli = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (options.dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
  }
  if (options.debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { directory, dangerouslyDestroyData, debug, env, configuration } = options;

  const environment = configuration.environments[env];

  // Set the port within the configuration to the correct value (flag over
  // environment variable over default value from the package.json file).
  environment.api.address.port =
    options.port ||
    processenv('WOLKENKIT_PORT') ||
    environment.api.address.port;

  const { port } = environment.api.address;
  const runtimeVersion = configuration.runtime.version;

  const sharedKeyByUser = options.sharedKey || processenv('WOLKENKIT_SHARED_KEY');
  const sharedKey = sharedKeyByUser || await generateSharedKey();
  const persistData = Boolean(sharedKeyByUser);

  await shared.checkDocker({ configuration, env }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  progress({ message: 'Verifying application status...', type: 'info' });
  const applicationStatus = await shared.getApplicationStatus({ configuration, env, sharedKey, persistData, debug }, progress);

  if (applicationStatus === 'running') {
    progress({ message: `The application is already running.`, type: 'info' });
    throw new errors.ApplicationAlreadyRunning();
  }
  if (applicationStatus === 'partially-running') {
    progress({ message: `The application is partially running.`, type: 'info' });
    throw new errors.ApplicationPartiallyRunning();
  }

  progress({ message: 'Verifying that ports are available...', type: 'info' });
  await verifyThatPortsAreAvailable({ forVersion: runtimeVersion, configuration, env, sharedKey, persistData, debug }, progress);

  if (await runtimes.getInstallationStatus({ configuration, env, forVersion: runtimeVersion }) !== 'installed') {
    progress({ message: `Installing wolkenkit ${runtimeVersion} on environment ${env}...`, type: 'info' });
    await install({ directory, env, version: runtimeVersion }, progress);
  }

  if (dangerouslyDestroyData) {
    progress({ message: 'Destroying previous data...', type: 'info' });
    await shared.destroyData({ configuration, env, sharedKey, persistData, debug }, progress);
  }

  progress({ message: 'Setting up network...', type: 'info' });
  await docker.ensureNetworkExists({ configuration, env });

  progress({ message: 'Building Docker images...', type: 'info' });
  await shared.buildImages({ directory, configuration, env }, progress);

  progress({ message: 'Starting Docker containers...', type: 'info' });
  await startContainers({ configuration, env, port, sharedKey, persistData, debug }, progress);

  progress({ message: `Using ${sharedKey} as shared key.`, type: 'info' });

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
    await shared.attachDebugger({ configuration, env, sharedKey, persistData, debug }, progress);
  }
};

module.exports = cli;
