'use strict';

const destroyData = require('../shared/destroyData'),
      docker = require('../../../docker'),
      errors = require('../../../errors'),
      getApplicationStatus = require('../shared/getApplicationStatus'),
      health = require('../health'),
      noop = require('../../../noop'),
      removeContainers = require('./removeContainers'),
      shared = require('../shared');

const stop = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (options.dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }

  const { directory, dangerouslyDestroyData, env } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true
  }, progress);

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

  const debug = existingContainers[0].labels['wolkenkit-debug'] === 'true',
        persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true',
        sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];

  const applicationStatus = await getApplicationStatus({ configuration, env, sharedKey, persistData, debug }, progress);

  if (applicationStatus === 'partially-running') {
    progress({ message: `The application is partially running.`, type: 'info' });
  }

  progress({ message: `Removing Docker containers...`, type: 'info' });
  await removeContainers({ configuration, env }, progress);

  progress({ message: `Removing network...`, type: 'info' });
  await docker.removeNetwork({ configuration, env });

  if (dangerouslyDestroyData) {
    progress({ message: 'Destroying previous data...', type: 'info' });
    await destroyData({ configuration, env, sharedKey, persistData, debug }, progress);
  }
};

module.exports = stop;
