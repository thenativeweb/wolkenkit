'use strict';

const docker = require('../../docker');

const getApplicationStatus = async function ({
  configuration,
  dangerouslyExposeHttpPorts,
  debug,
  secret
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
  if (!secret) {
    throw new Error('Secret is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const existingContainers = await docker.getContainers({
    configuration,
    where: {
      label: {
        'wolkenkit-application': configuration.application.name,
        'wolkenkit-type': 'application'
      }
    }
  });

  if (existingContainers.length === 0) {
    return 'not-running';
  }

  const containers = await configuration.applicationContainers({
    dangerouslyExposeHttpPorts,
    debug,
    secret
  });

  if (existingContainers.length < containers.length) {
    return 'partially-running';
  }

  return 'running';
};

module.exports = getApplicationStatus;
