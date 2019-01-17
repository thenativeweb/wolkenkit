'use strict';

const docker = require('../../../docker');

const destroyData = async function ({
  configuration,
  dangerouslyExposeHttpPorts,
  debug,
  persistData,
  sharedKey
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (dangerouslyExposeHttpPorts === undefined) {
    throw new Error('Dangerously expose http ports is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const containers = await configuration.containers({
    dangerouslyExposeHttpPorts,
    debug,
    persistData,
    sharedKey
  });

  await Promise.all(containers.map(async container =>
    docker.removeVolume({ configuration, name: `${container.name}-volume` })));
};

module.exports = destroyData;
