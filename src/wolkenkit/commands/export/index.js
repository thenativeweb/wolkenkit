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

    let currentFileStream,
        numberOfProcessedEvents = 0,
        numberOfWrittenFiles = 0;

    let unsubscribe;

    await new Promise((resolve, reject) => {
      try {
        const onData = function (event) {
          const eventsInCurrentFile = numberOfProcessedEvents % eventsPerFile;

          if (eventsInCurrentFile === 0) {
            const fileNumber = numberOfWrittenFiles + 1;
            const fileName = `events-${String(fileNumber).padStart(16, '0')}.json`;
            const fileNameAbsolute = path.join(eventStoreDirectory, fileName);

            currentFileStream = fs.createWriteStream(fileNameAbsolute, { encoding: 'utf8' });
            currentFileStream.write('[\n');
          } else {
            currentFileStream.write(',\n');
          }

          currentFileStream.write(`  ${JSON.stringify(event)}`);
          numberOfProcessedEvents += 1;

          const eventsInNextFile = numberOfProcessedEvents % eventsPerFile;

          if (eventsInNextFile === 0) {
            currentFileStream.write('\n]\n');
            currentFileStream.end();

            currentFileStream = undefined;
            numberOfWrittenFiles += 1;

            progress({ message: `Processed ${numberOfProcessedEvents} events.`, type: 'info' });
          }
        };

        const onEnd = function () {
          unsubscribe();

          if (currentFileStream) {
            currentFileStream.write('\n]\n');
            currentFileStream.end();
          }

          resolve();
        };

        const onError = function (err) {
          unsubscribe();
          reject(err);
        };

        replayStream.on('data', onData);
        replayStream.on('end', onEnd);
        replayStream.on('error', onError);

        unsubscribe = function () {
          replayStream.removeListener('data', onData);
          replayStream.removeListener('end', onEnd);
          replayStream.removeListener('error', onError);
        };
      } catch (ex) {
        reject(ex);
      }
    });
  }
};

module.exports = exportCommand;
