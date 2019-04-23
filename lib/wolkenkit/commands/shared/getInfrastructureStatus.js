'use strict';

const docker = require('../../../docker');

const getInfrastructureStatus = async function ({
  configuration,
  debug,
  secret
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
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
        'wolkenkit-type': 'infrastructure'
      }
    }
  });

  if (existingContainers.length === 0) {
    return 'not-running';
  }

  const containers = await configuration.infrastructureContainers({
    dangerouslyExposeHttpPorts: false,
    debug,
    secret
  });

  if (existingContainers.length < containers.length) {
    return 'partially-running';
  }

  return 'running';
};

module.exports = getInfrastructureStatus;
