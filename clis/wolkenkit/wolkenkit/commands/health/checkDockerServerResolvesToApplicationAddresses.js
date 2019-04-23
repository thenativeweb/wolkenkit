'use strict';

const arrayToSentence = require('array-to-sentence'),
      intersectionWith = require('lodash/intersectionWith'),
      isEqual = require('lodash/isEqual');

const docker = require('../../../docker'),
      errors = require('../../../errors');

const checkDockerServerResolvesToApplicationAddresses = async function ({
  configuration,
  applicationAddresses
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!applicationAddresses) {
    throw new Error('Application addresses are missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  let dockerAddresses;

  try {
    dockerAddresses = await docker.getHostIpAddresses({ configuration });
  } catch (ex) {
    progress({ message: ex.message });
    progress({ message: 'Failed to resolve Docker server.', type: 'info' });

    throw ex;
  }

  progress({ message: `Docker server resolves to ${arrayToSentence(dockerAddresses.map(ip => ip.address))}.` });

  if (intersectionWith(applicationAddresses, dockerAddresses, isEqual).length === 0) {
    progress({ message: `Application and Docker server do not resolve to the same IP address.`, type: 'info' });

    throw new errors.AddressMismatch();
  }
};

module.exports = checkDockerServerResolvesToApplicationAddresses;
