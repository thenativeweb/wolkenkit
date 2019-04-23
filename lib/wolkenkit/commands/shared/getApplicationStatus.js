'use strict';

const docker = require('../../../docker');

const getApplicationStatus = async function ({
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

  const existingContainers = await docker.getContainers({
    configuration,
    where: { label: { 'wolkenkit-application': configuration.application.name }}
  });

  if (existingContainers.length === 0) {
    return 'not-running';
  }

  const containers = await configuration.containers({
    dangerouslyExposeHttpPorts,
    debug,
    persistData,
    sharedKey
  });

  if (existingContainers.length < containers.length) {
    return 'partially-running';
  }

  return 'running';
};

module.exports = getApplicationStatus;
