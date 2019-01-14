'use strict';

const path = require('path');

const noop = require('../../../noop'),
      shared = require('../shared'),
      shell = require('../../../shell'),
      splitStreamToFiles = require('./splitStreamToFiles'),
      switchSemver = require('../../../switchSemver');

const exportEventStore = async function ({
  configuration,
  env,
  containers,
  sharedKey,
  exportDirectory
}, progress = noop) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!containers) {
    throw new Error('Containers are missing.');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (!exportDirectory) {
    throw new Error('Export directory is missing.');
  }

  const eventStoreDirectory = path.join(exportDirectory, 'event-store');

  await shell.mkdir('-p', eventStoreDirectory);

  const coreContainer = containers.find(container => container.name.endsWith('core'));

  if (!coreContainer) {
    throw new Error('Invalid operation.');
  }

  /* eslint-disable global-require */
  const eventStore = require(`wolkenkit-eventstore/${coreContainer.env.EVENTSTORE_TYPE}`);
  /* eslint-enable global-require */

  const runtimeVersion = configuration.runtime.version;
  const currentEnvironment = configuration.environments[env];

  await switchSemver(runtimeVersion, {
    async '<= 3.0.0' () {
      await eventStore.initialize({
        url: `pg://wolkenkit:${sharedKey}@${currentEnvironment.api.address.host}:${currentEnvironment.api.address.port + 3}/wolkenkit`,
        namespace: `${configuration.application}domain`
      });
    },

    async default () {
      await eventStore.initialize({
        url: `pg://wolkenkit:${sharedKey}@${currentEnvironment.api.address.host}:${currentEnvironment.api.address.port + 30}/wolkenkit`,
        namespace: `${configuration.application}domain`
      });
    }
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
