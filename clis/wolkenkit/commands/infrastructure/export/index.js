'use strict';

const fs = require('fs'),
      path = require('path'),
      { promisify } = require('util');

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      exportEventStore = require('./exportEventStore'),
      health = require('../../health'),
      noop = require('../../../noop'),
      runtimes = require('../../../runtimes'),
      shared = require('../../shared'),
      shell = require('../../../shell');

const readdir = promisify(fs.readdir);

const exportCommand = async function ({
  directory,
  env,
  fromEventStore,
  to
}, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (fromEventStore === undefined) {
    throw new Error('From event store is missing.');
  }
  if (!to) {
    throw new Error('To is missing.');
  }

  let configuration = await shared.getConfiguration({
    directory,
    env,
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

  const exportDirectory = path.isAbsolute(to) ? to : path.join(directory, to);

  await shell.mkdir('-p', exportDirectory);

  const entries = await readdir(exportDirectory);

  if (entries.length > 0) {
    progress({ message: 'The export directory is not empty.', type: 'info' });

    throw new errors.DirectoryNotEmpty();
  }

  const connections = await runtimes.getConnections({
    configuration,
    dangerouslyExposeHttpPorts: false,
    debug,
    forVersion: configuration.application.runtime.version,
    secret
  });

  if (fromEventStore) {
    await exportEventStore({
      configuration,
      connections,
      exportDirectory,
      secret
    }, progress);
  }
};

module.exports = exportCommand;
