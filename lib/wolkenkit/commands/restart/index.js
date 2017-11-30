'use strict';

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      health = require('../health'),
      noop = require('../../../noop'),
      shared = require('../shared'),
      start = require('../start'),
      stop = require('../stop');

const restart = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }

  const { directory, env, privateKey } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true
  }, progress);

  const environment = configuration.environments[env];

  if (environment.type === 'aufwind') {
    progress({ message: `Deploying application to aufwind...`, type: 'info' });
    const tunnel = await shared.startTunnel({ configuration, env, privateKey }, progress);

    const application = configuration.application;
    const endpoint = {
      protocol: 'http:',
      method: 'POST',
      hostname: tunnel.host,
      port: tunnel.port,
      pathname: `/v1/applications/${application}/restart/${env}`
    };

    await shared.streamApplication({ directory, endpoint, tunnel }, progress);

    return;
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

  if (existingContainers.length === 0) {
    progress({ message: `The application is not running.`, type: 'info' });
    throw new errors.ApplicationNotRunning();
  }

  const debug = existingContainers[0].labels['wolkenkit-debug'] === 'true',
        persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true',
        port = Number(existingContainers[0].labels['wolkenkit-api-port']),
        sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];

  progress({ message: `Stopping the application on environment ${env}...`, type: 'info' });
  await stop({ directory, env, dangerouslyDestroyData: false }, progress);

  const startOptions = { directory, env, dangerouslyDestroyData: false, debug, port };

  if (persistData) {
    startOptions.sharedKey = sharedKey;
  }

  progress({ message: `Starting the application on environment ${env}...`, type: 'info' });
  await start(startOptions, progress);
};

module.exports = restart;
