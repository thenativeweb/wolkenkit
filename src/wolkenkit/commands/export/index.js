'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      exportEventStore = require('./exportEventStore'),
      health = require('../health'),
      noop = require('../../../noop'),
      runtimes = require('../../runtimes'),
      shared = require('../shared'),
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

  const configuration = await shared.getConfiguration({
    directory,
    env,
    isPackageJsonRequired: false
  }, progress);

  await shared.checkDocker({ configuration }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  progress({ message: 'Verifying application status...', type: 'info' });
  const existingContainers = await docker.getContainers({
    configuration,
    where: { label: { 'wolkenkit-application': configuration.application.name }}
  });

  if (existingContainers.length === 0) {
    progress({ message: `The application is not running.`, type: 'info' });
    throw new errors.ApplicationNotRunning();
  }

  const dangerouslyExposeHttpPorts = existingContainers[0].labels['wolkenkit-dangerously-expose-http-ports'] === 'true',
        debug = existingContainers[0].labels['wolkenkit-debug'] === 'true',
        persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true',
        sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];

  const containers = await configuration.containers({
    dangerouslyExposeHttpPorts,
    debug,
    persistData,
    sharedKey
  });

  if (existingContainers.length < containers.length) {
    progress({ message: `The application is partially running.`, type: 'info' });
    throw new errors.ApplicationPartiallyRunning();
  }

  const exportDirectory = path.isAbsolute(to) ? to : path.join(directory, to);

  await shell.mkdir('-p', exportDirectory);

  const entries = await readdir(exportDirectory);

  if (entries.length > 0) {
    progress({ message: 'The export directory is not empty.', type: 'info' });

    throw new errors.DirectoryNotEmpty();
  }

  const connections = await runtimes.getConnections({
    configuration,
    dangerouslyExposeHttpPorts,
    debug,
    forVersion: configuration.application.runtime.version,
    persistData,
    sharedKey
  });

  if (fromEventStore) {
    await exportEventStore({
      configuration,
      connections,
      exportDirectory,
      sharedKey
    }, progress);
  }
};

module.exports = exportCommand;
