'use strict';

const map = require('lodash/map'),
      sortBy = require('lodash/sortBy');

const shared = require('../../../shared');

const verifyThatPortsAreAvailable = async function ({
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

  const applicationContainers = await configuration.applicationContainers({
    dangerouslyExposeHttpPorts,
    debug,
    secret
  });

  const requestedPorts = sortBy(
    map(applicationContainers, applicationContainer => applicationContainer.ports).
      filter(ports => ports).
      reduce((list, ports) => [ ...list, ...Object.values(ports) ], [])
  );

  const host = configuration.api.host.name;

  await shared.verifyThatPortsAreAvailable({ host, requestedPorts }, progress);
};

module.exports = verifyThatPortsAreAvailable;
