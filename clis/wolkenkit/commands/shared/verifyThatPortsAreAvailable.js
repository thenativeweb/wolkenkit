'use strict';

const arrayToSentence = require('array-to-sentence'),
      portscanner = require('portscanner');

const errors = require('../../errors');

const verifyThatPortsAreAvailable = async function ({
  host,
  requestedPorts
}, progress) {
  if (!host) {
    throw new Error('Host is missing.');
  }
  if (!requestedPorts) {
    throw new Error('Requested ports are missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

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
