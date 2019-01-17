'use strict';

const arrayToSentence = require('array-to-sentence'),
      map = require('lodash/map'),
      portscanner = require('portscanner'),
      sortBy = require('lodash/sortBy');

const errors = require('../../../../errors');

const verifyThatPortsAreAvailable = async function ({
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

  const requestedPorts = sortBy(
    map(containers, container => container.ports).
      filter(ports => ports).
      reduce((list, ports) => [ ...list, ...Object.values(ports) ], [])
  );

  const host = configuration.api.host.name;

  const notAvailablePorts = [];

  for (const port of requestedPorts) {
    const portStatus = await portscanner.checkPortStatus(port, host);

    if (portStatus === 'closed') {
      progress({ message: `Verified that port ${port} is available.`, type: 'verbose' });
      continue;
    }

    notAvailablePorts.push(port);
  }

  if (notAvailablePorts.length === 1) {
    progress({ message: `Port ${notAvailablePorts[0]} is not available.`, type: 'info' });
    throw new errors.PortsNotAvailable();
  }

  if (notAvailablePorts.length > 1) {
    progress({ message: `Ports ${arrayToSentence(notAvailablePorts)} are not available.`, type: 'info' });
    throw new errors.PortsNotAvailable();
  }
};

module.exports = verifyThatPortsAreAvailable;
