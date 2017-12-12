'use strict';

const difference = require('lodash/difference'),
      remove = require('lodash/remove');

const docker = require('../../../../docker'),
      runtimes = require('../../../runtimes'),
      sleep = require('../../../../sleep');

const startContainers = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (options.persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (options.debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { configuration, env, sharedKey, persistData, debug } = options;

  const runtime = configuration.runtime.version;

  const containers = await runtimes.getContainers({
    forVersion: runtime,
    configuration,
    env,
    sharedKey,
    persistData,
    debug
  });

  const numberOfContainers = containers.length;
  const started = [];

  while (started.length < numberOfContainers) {
    const nextContainerToStart = containers.find(container => {
      const dependsOn = container.dependsOn || [];
      const startedContainerNames = started.map(startedContainer => startedContainer.name);

      return difference(dependsOn, startedContainerNames).length === 0;
    });

    if (nextContainerToStart) {
      remove(containers, container => container.name === nextContainerToStart.name);

      /* eslint-disable no-loop-func */
      (async () => {
        await docker.startContainer({ configuration, env, container: nextContainerToStart });

        started.push(nextContainerToStart);
        progress({ message: `Started ${nextContainerToStart.name} (${started.length}/${numberOfContainers}).`, type: 'info' });
      })();
      /* eslint-enable no-loop-func */
    }

    await sleep(50);
  }
};

module.exports = startContainers;
