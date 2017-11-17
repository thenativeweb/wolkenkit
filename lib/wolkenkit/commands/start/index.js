'use strict';

const url = require('url');

const processenv = require('processenv');

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      generateSharedKey = require('./generateSharedKey'),
      health = require('../health'),
      install = require('../install'),
      noop = require('../../../noop'),
      runtimes = require('../../runtimes'),
      shared = require('../shared'),
      startContainers = require('./startContainers'),
      verifyThatPortsAreAvailable = require('./verifyThatPortsAreAvailable');

const start = async function (options, progress = noop) {
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

  const { directory, dangerouslyDestroyData, debug, env, privateKey } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true
  }, progress);

  shared.validateCode({ directory }, progress);

  const environment = configuration.environments[env];

  if (environment.type === 'aufwind') {
    progress({ message: `Deploying application to aufwind...`, type: 'info' });

    const application = configuration.application;
    const tunnel = await shared.startTunnel({ configuration, env, privateKey }, progress);

    const endpoint = url.format({
      protocol: 'http:',
      hostname: tunnel.host,
      port: tunnel.port,
      pathname: `/v1/instances/start/${env}`
    });

    await shared.streamApplication({ application, directory, endpoint, tunnel }, progress);

    return;
  }

  // Set the port within the configuration to the correct value (flag over
  // environment variable over default value from the package.json file).
  environment.api.address.port =
    options.port ||
    processenv('WOLKENKIT_PORT') ||
    environment.api.address.port;

  const { host, port } = environment.api.address;
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
  progress({ message: `Waiting for https://${host}:${port}/v1/ping to reply...`, type: 'info' });

  await shared.waitForApplication({ configuration, env }, progress);

  if (debug) {
    await shared.attachDebugger({ configuration, env, sharedKey, persistData, debug }, progress);
  }
};

module.exports = start;
