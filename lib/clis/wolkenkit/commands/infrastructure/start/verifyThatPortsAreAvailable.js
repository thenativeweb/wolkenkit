'use strict';

const map = require('lodash/map'),
      sortBy = require('lodash/sortBy');

const shared = require('../../shared');

const verifyThatPortsAreAvailable = async function ({
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

  const infrastructureContainers = await configuration.infrastructureContainers({
    dangerouslyExposeHttpPorts: false,
    debug,
    secret
  });

  const requestedPorts = sortBy(
    map(infrastructureContainers, infrastructureContainer => infrastructureContainer.ports).
      filter(ports => ports).
      reduce((list, ports) => [ ...list, ...Object.values(ports) ], [])
  );

  const host = configuration.api.host.name;

  await shared.verifyThatPortsAreAvailable({ host, requestedPorts }, progress);
};

module.exports = verifyThatPortsAreAvailable;
