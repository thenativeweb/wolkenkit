'use strict';

const arrayToSentence = require('array-to-sentence'),
      intersectionWith = require('lodash/intersectionWith'),
      isEqual = require('lodash/isEqual');

const docker = require('../../../docker'),
      errors = require('../../../errors');

const checkDockerServerResolvesToApplicationAddresses = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.applicationAddresses) {
    throw new Error('Application addresses are missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { configuration, env, applicationAddresses } = options;

  let dockerAddresses;

  try {
    dockerAddresses = await docker.getHostIpAddresses({ configuration, env });
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
