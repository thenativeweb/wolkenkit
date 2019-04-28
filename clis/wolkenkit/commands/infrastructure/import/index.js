'use strict';

const path = require('path');

const noop = require('lodash/noop');

const checkImportDirectory = require('./checkImportDirectory'),
      docker = require('../../../docker'),
      errors = require('../../../errors'),
      health = require('../../health'),
      importEventStore = require('./importEventStore'),
      runtimes = require('../../../runtimes'),
      shared = require('../../shared');

const importCommand = async function ({
  directory,
  env,
  from,
  toEventStore
}, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!from) {
    throw new Error('From is missing.');
  }
  if (toEventStore === undefined) {
    throw new Error('To event store is missing.');
  }

  let configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: false
  }, progress);

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
    throw new errors.InfrastructureNotRunning();
  }

  const debug = existingInfrastructureContainers[0].labels['wolkenkit-debug'] === 'true',
        port = Number(existingInfrastructureContainers[0].labels['wolkenkit-api-port']),
        secret = existingInfrastructureContainers[0].labels['wolkenkit-secret'];

  const infrastructureStatus = await shared.getInfrastructureStatus({
    configuration,
    debug,
    secret
  }, progress);

  if (infrastructureStatus === 'partially-running') {
    throw new errors.InfrastructurePartiallyRunning();
  }

  configuration = await shared.getConfiguration({
    directory,
    env,
    isPackageJsonRequired: false,
    port
  }, progress);

  const importDirectory = path.isAbsolute(from) ? from : path.join(directory, from);

  await checkImportDirectory({ importDirectory, toEventStore }, progress);

  const connections = await runtimes.getConnections({
    configuration,
    dangerouslyExposeHttpPorts: false,
    debug,
    forVersion: configuration.application.runtime.version,
    secret
  });

  if (toEventStore) {
    await importEventStore({
      configuration,
      connections,
      importDirectory,
      secret
    }, progress);
  }
};

module.exports = importCommand;
