'use strict';

const fs = require('fs'),
      { PassThrough } = require('stream'),
      path = require('path');

const { Event } = require('commands-events'),
      jsonStream = require('JSONStream'),
      promisify = require('util.promisify'),
      pump = require('pump');

const errors = require('../../../errors'),
      isEventStoreEmpty = require('./isEventStoreEmpty'),
      noop = require('../../../noop'),
      shared = require('../shared');

const readdir = promisify(fs.readdir);

const importEventStore = async function ({
  configuration,
  env,
  sharedKey,
  containers,
  importDirectory
}, progress = noop) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (!containers) {
    throw new Error('Containers are missing.');
  }
  if (!importDirectory) {
    throw new Error('Import directory is missing.');
  }

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

  if (!await isEventStoreEmpty({ eventStore })) {
    progress({ message: 'The event store is not empty.', type: 'info' });

    throw new errors.EventStoreNotEmpty();
  }

  const eventStoreDirectory = path.join(importDirectory, 'event-store');
  const entries = await readdir(eventStoreDirectory);

  const eventFiles = entries.
    filter(eventFile => shared.eventFile.isValidFileName(eventFile));

  const numberOfEventsPerSave = 1024;

  let events = [],
      numberOfProcessedEvents = 0;

  for (let i = 0; i < eventFiles.length; i++) {
    const eventFile = eventFiles[i];
    const eventFileAbsolute = path.join(eventStoreDirectory, eventFile);

    const eventStream = fs.createReadStream(eventFileAbsolute, { encoding: 'utf8' });
    const parseStream = jsonStream.parse('.*');
    const passThrough = new PassThrough({ objectMode: true });

    // We intentionally do not use await here, because we want to process the
    // stream in an asynchronous way further down below.
    pump(eventStream, parseStream, passThrough);

    for await (const data of passThrough) {
      const event = Event.wrap(data);

      events.push(event);
      numberOfProcessedEvents += 1;

      if (events.length === numberOfEventsPerSave) {
        await eventStore.saveEvents({ events });

        progress({ message: `Processed ${numberOfProcessedEvents} events.`, type: 'info' });

        events = [];
      }
    }
  }

  if (events.length > 0) {
    await eventStore.saveEvents({ events });

    progress({ message: `Processed ${numberOfProcessedEvents} events.`, type: 'info' });
  }
};

module.exports = importEventStore;
