'use strict';

const path = require('path');

const noop = require('../../../noop'),
      shared = require('../shared'),
      shell = require('../../../shell'),
      splitStreamToFiles = require('./splitStreamToFiles');

const exportEventStore = async function ({
  configuration,
  connections,
  exportDirectory,
  sharedKey
}, progress = noop) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!connections) {
    throw new Error('Connections are missing.');
  }
  if (!exportDirectory) {
    throw new Error('Export directory is missing.');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing.');
  }

  const eventStoreDirectory = path.join(exportDirectory, 'event-store');

  await shell.mkdir('-p', eventStoreDirectory);

  const { type, external } = connections.eventStore;
  const { protocol, user, password, hostname, port, database } = external.pg;

  /* eslint-disable global-require */
  const eventStore = require(`wolkenkit-eventstore/${type}`);
  /* eslint-enable global-require */

  await eventStore.initialize({
    url: `${protocol}://${user}:${password}@${hostname}:${port}/${database}`,
    namespace: `${configuration.application.name}domain`
  });

  const replayStream = await eventStore.getReplay();
  const eventsPerFile = 2 ** 16;

  await splitStreamToFiles({
    stream: replayStream,
    getFileName (fileNumber) {
      const fileName = shared.eventFile.getFileName(fileNumber);
      const fileNameAbsolute = path.join(eventStoreDirectory, fileName);

      return fileNameAbsolute;
    },
    eventsPerFile
  }, progress);
};

module.exports = exportEventStore;
