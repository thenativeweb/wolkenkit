'use strict';

const url = require('url');

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      getIpAddresses = require('../../../common/utils/network/getIpAddresses');

const getHostIpAddresses = async function ({ configuration }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });
  const localhostAddresses = [
    { address: '127.0.0.1', family: 4 },
    { address: '::1', family: 6 }
  ];

  if (!environmentVariables.DOCKER_HOST) {
    return localhostAddresses;
  }

  let parsedUrl;

  try {
    parsedUrl = url.parse(environmentVariables.DOCKER_HOST);
  } catch {
    // If there is no valid url in the environment variable, we assume that
    // it contains a path to a socket, so we can assume localhost.
    return localhostAddresses;
  }

  if (!parsedUrl.hostname) {
    return localhostAddresses;
  }

  const addresses = await getIpAddresses(parsedUrl.hostname);

  return addresses;
};

module.exports = getHostIpAddresses;
