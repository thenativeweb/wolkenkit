'use strict';

const request = require('requestretry');

const errors = require('../../../errors');

const waitForSshTunnel = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.host) {
    throw new Error('Host is missing.');
  }
  if (!options.port) {
    throw new Error('Port is missing.');
  }

  const { host, port } = options;

  const result = await request({
    url: `http://${host}:${port}/v1/ping`,
    json: true,
    fullResponse: false,
    maxAttempts: 5,
    retryDelay: 2 * 1000,
    retryStrategy: request.RetryStrategies.HTTPOrNetworkError
  });

  if (result.api !== 'v1') {
    throw new errors.JsonMalformed();
  }
};

module.exports = waitForSshTunnel;
