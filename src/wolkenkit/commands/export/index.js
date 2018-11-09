'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const docker = require('../../../docker'),
      errors = require('../../../errors'),
      health = require('../health'),
      noop = require('../../../noop'),
      runtimes = require('../../runtimes'),
      shared = require('../shared'),
      shell = require('../../../shell');

const readdir = promisify(fs.readdir);

const exportCommand = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.to) {
    throw new Error('To is missing.');
  }
  if (options.fromEventStore === undefined) {
    throw new Error('From event store is missing.');
  }

  const { directory, env, to, fromEventStore } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: false
  }, progress);

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

  const { version } = configuration.runtime;

  const debug = existingContainers[0].labels['wolkenkit-debug'] === 'true',
        persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true',
        sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];

  const containers = await runtimes.getContainers({
    forVersion: version,
    configuration,
    env,
    sharedKey,
    persistData,
    debug
  });

  if (existingContainers.length < containers.length) {
    progress({ message: `The application is partially running.`, type: 'info' });
    throw new errors.ApplicationPartiallyRunning();
  }

  const toAbsolute = path.isAbsolute(to) ? to : path.join(directory, to);

  await shell.mkdir('-p', toAbsolute);

  const entries = await readdir(toAbsolute);

  if (entries.length > 0) {
    progress({ message: 'The to directory is not empty.', type: 'info' });

    throw new errors.DirectoryNotEmpty();
  }

  if (fromEventStore) {
    const eventStoreDirectory = path.join(toAbsolute, 'event-store');

    await shell.mkdir('-p', eventStoreDirectory);

    const coreContainer = containers.find(container => container.name.endsWith('core'));

    if (!coreContainer) {
      throw new Error('Invalid operation.');
    }

    /* eslint-disable global-require */
    const eventStore = require(`wolkenkit-eventstore/${coreContainer.env.EVENTSTORE_TYPE}`);
    /* eslint-enable global-require */

    const currentEnvironment = configuration.environments[env];

    await eventStore.initialize({
      url: `pg://wolkenkit:${sharedKey}@${currentEnvironment.api.address.host}:${currentEnvironment.api.address.port + 3}/wolkenkit`,
      namespace: `${configuration.application}domain`
    });

    const replayStream = await eventStore.getReplay();

    const eventsPerFile = 2 ** 16;
    let counter = 0;
    let fileNumber = 1;

    let writeStream;

    for await (const event of replayStream) {
      let eventsInFile = counter % eventsPerFile;

      if (eventsInFile === 0) {
        const fileName = `events-${String(fileNumber).padStart(16, '0')}.json`;

        writeStream = fs.createWriteStream(
          path.join(eventStoreDirectory, fileName),
          { encoding: 'utf8' }
        );

        writeStream.write('[\n');
      } else {
        writeStream.write(',\n');
      }

      const json = JSON.stringify(event);

      writeStream.write(`  ${json}`);

      counter += 1;
      eventsInFile = counter % eventsPerFile;

      if (eventsInFile === 0) {
        writeStream.write('\n]\n');
        writeStream.end();

        writeStream = undefined;
        fileNumber += 1;
      }
    }

    if (writeStream) {
      writeStream.write('\n]\n');
      writeStream.end();
    }
  }
};

module.exports = exportCommand;
