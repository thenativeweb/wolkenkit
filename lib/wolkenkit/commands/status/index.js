'use strict';

const url = require('url');

const request = require('superagent');

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      getApplicationStatus = require('../shared/getApplicationStatus'),
      health = require('../health'),
      noop = require('../../../noop'),
      shared = require('../shared');

const status = async function (options, progress = noop) {
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

  const selectedEnvironment = configuration.environments[env];

  if (selectedEnvironment.type === 'aufwind') {
    const tunnel = await shared.startTunnel({ configuration, env, privateKey }, progress);

    const endpoint = url.format({
      protocol: 'http:',
      hostname: tunnel.host,
      port: tunnel.port,
      pathname: `/v1/applications/${configuration.application}/status/${env}`
    });

    progress({ message: `Using ${endpoint} as route.` });

    const response = await request.get(endpoint).send({});

    tunnel.close();

    const applicationStatus = response.body.status;

    if (applicationStatus === 'not-running') {
      throw new errors.ApplicationNotRunning();
    }

    return;
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
    throw new errors.ApplicationNotRunning();
  }

  const debug = existingContainers[0].labels['wolkenkit-debug'] === 'true',
        persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true',
        sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];

  const applicationStatus = await getApplicationStatus({ configuration, env, sharedKey, persistData, debug }, progress);

  if (applicationStatus === 'partially-running') {
    throw new errors.ApplicationPartiallyRunning();
  }
};

module.exports = status;
