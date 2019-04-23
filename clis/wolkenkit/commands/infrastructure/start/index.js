'use strict';

const processenv = require('processenv');

const buildImages = require('./buildImages'),
      docker = require('../../../docker'),
      ensureVolumesExist = require('./ensureVolumesExist'),
      errors = require('../../../errors'),
      health = require('../../health'),
      install = require('../../runtime/install'),
      noop = require('../../../noop'),
      runtimes = require('../../../runtimes'),
      shared = require('../../shared'),
      startContainers = require('./startContainers'),
      stop = require('../stop'),
      verifyThatPortsAreAvailable = require('./verifyThatPortsAreAvailable');

const start = async function ({
  directory,
  dangerouslyDestroyData,
  debug,
  env,
  port,
  secret
}, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true,
    port
  }, progress);

  await shared.checkDocker({ configuration }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  const existingVolumes = await docker.getVolumes({
    configuration,
    where: {
      label: {
        'wolkenkit-application': configuration.application.name,
        'wolkenkit-type': 'infrastructure'
      }
    }
  });

  let actualSecret;

  if (existingVolumes.length === 0 || dangerouslyDestroyData) {
    const secretByUser = secret || processenv('WOLKENKIT_SECRET');

    actualSecret = secretByUser || await shared.generateSecret();
  } else {
    actualSecret = existingVolumes[0].labels['wolkenkit-secret'];
  }

  progress({ message: 'Verifying infrastructure status...', type: 'info' });
  const infrastructureStatus = await shared.getInfrastructureStatus({
    configuration,
    debug,
    secret: actualSecret
  }, progress);

  if (infrastructureStatus === 'running') {
    progress({ message: `The infrastructure is already running.`, type: 'info' });
    throw new errors.InfrastructureAlreadyRunning();
  }
  if (infrastructureStatus === 'partially-running') {
    progress({ message: `The infrastructure is partially running.`, type: 'info' });
    throw new errors.InfrastructurePartiallyRunning();
  }

  progress({ message: 'Verifying that ports are available...', type: 'info' });
  await verifyThatPortsAreAvailable({ configuration, debug, secret: actualSecret }, progress);

  progress({ message: 'Verifying that file storage is available...', type: 'info' });
  await shared.verifyThatFileStorageIsAvailable({ configuration }, progress);

  const runtimeVersion = configuration.application.runtime.version;

  if (await runtimes.getInstallationStatus({ configuration, forVersion: runtimeVersion }) !== 'installed') {
    progress({ message: `Installing wolkenkit ${runtimeVersion} on environment ${env}...`, type: 'info' });
    await install({ directory, env, version: runtimeVersion }, progress);
  }

  if (dangerouslyDestroyData) {
    progress({ message: 'Destroying previous data...', type: 'verbose' });
    await shared.destroyData({ configuration, secret: actualSecret }, progress);
    progress({ message: 'Destroyed previous data.', type: 'warn' });
  }

  progress({ message: 'Setting up volumes...', type: 'info' });
  await ensureVolumesExist({ configuration, secret: actualSecret }, progress);

  progress({ message: 'Setting up network...', type: 'info' });
  await docker.ensureNetworkExists({ configuration });

  progress({ message: 'Building Docker images...', type: 'info' });
  await buildImages({ configuration, directory }, progress);

  progress({ message: 'Starting Docker containers...', type: 'info' });
  try {
    await startContainers({ configuration, debug, secret: actualSecret }, progress);
  } catch (ex) {
    await stop({ dangerouslyDestroyData: false, directory, env, port }, noop);

    throw ex;
  }

  progress({ message: `Using ${actualSecret} as secret.`, type: 'info' });
};

module.exports = start;
