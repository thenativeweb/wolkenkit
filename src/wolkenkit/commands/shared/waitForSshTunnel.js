'use strict';

const axios = require('axios'),
      retry = require('async-retry'),
      semver = require('semver');

const errors = require('../../../errors');

const waitForSshTunnel = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.host) {
    throw new Error('Host is missing.');
  }
  if (!options.port) {
    throw new Error('Port is missing.');
  }

  const { host, port } = options;
  const { version } = options.configuration.runtime;

  if (version !== 'latest' && semver.lte(version, '2.0.0')) {
    const response = await retry(async () => await axios({
      method: 'get',
      url: `http://${host}:${port}/v1/ping`
    }), {
      retries: 5,
      maxTimeout: 2 * 1000
    });

    if (response.data.api !== 'v1') {
      throw new errors.JsonMalformed();
    }

    return;
  }

  await retry(async () => {
    await axios({
      method: 'get',
      url: `http://${host}:${port}/`
    });
  }, {
    retries: 5,
    maxTimeout: 2 * 1000
  });
};

module.exports = waitForSshTunnel;
