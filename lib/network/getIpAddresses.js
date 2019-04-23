'use strict';

const dns = require('dns');

const promisify = require('util.promisify');

const ip = require('./ip');

const lookup = promisify(dns.lookup);

const getIpAddresses = async function (hostOrIp) {
  if (!hostOrIp) {
    throw new Error('Host or IP is missing.');
  }

  if (ip.is(hostOrIp)) {
    return [{ address: hostOrIp, family: ip.getFamily(hostOrIp) }];
  }

  const addresses = await lookup(hostOrIp, { all: true });

  return addresses;
};

module.exports = getIpAddresses;
