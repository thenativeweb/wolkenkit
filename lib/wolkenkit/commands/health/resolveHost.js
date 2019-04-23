'use strict';

const arrayToSentence = require('array-to-sentence');

const network = require('../../../network');

const resolveHost = async function ({ configuration }, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const host = configuration.api.host.name;

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
