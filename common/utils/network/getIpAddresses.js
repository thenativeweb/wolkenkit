'use strict';

const dns = require('dns'),
      { promisify } = require('util');

const isEqual = require('lodash/isEqual'),
      uniqWith = require('lodash/uniqWith');

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
  const uniqueAddresses = uniqWith(addresses, isEqual);

  return uniqueAddresses;
};

module.exports = getIpAddresses;
