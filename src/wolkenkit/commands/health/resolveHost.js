'use strict';

const arrayToSentence = require('array-to-sentence');

const network = require('../../../network');

const resolveHost = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { configuration, env } = options;

  const host = configuration.environments[env].api.address.host;

  let addresses;

  try {
    addresses = await network.getIpAddresses(host);
  } catch (ex) {
    progress({ message: ex.message });
    progress({ message: `Failed to resolve ${host}.`, type: 'info' });

    throw ex;
  }

  progress({ message: `Application host ${host} resolves to ${arrayToSentence(addresses.map(ip => ip.address))}.` });

  return addresses;
};

module.exports = resolveHost;
