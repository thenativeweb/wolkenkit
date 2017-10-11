'use strict';

const docker = require('../../../docker'),
      runtimes = require('../../runtimes');

const destroyData = async function (options, progress) {
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

  await Promise.all(containers.map(async container =>
    docker.removeVolume({ configuration, env, name: `${container.name}-volume` })
  ));
};

module.exports = destroyData;
