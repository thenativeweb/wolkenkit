'use strict';

const shared = require('../../shared');

const startContainers = async function ({ configuration, debug, secret }, progress) {
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

  const containers = await configuration.infrastructureContainers({
    dangerouslyExposeHttpPorts: false,
    debug,
    secret
  });

  await shared.startContainers({ configuration, containers }, progress);
};

module.exports = startContainers;
