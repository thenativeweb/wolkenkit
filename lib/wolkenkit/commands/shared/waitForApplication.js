'use strict';

const nodeenv = require('nodeenv'),
      request = require('requestretry');

const errors = require('../../../errors');

const waitForApplication = async function (options, progress) {
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
  let { host, port } = options;

  const restoreEnvironment = nodeenv('NODE_TLS_REJECT_UNAUTHORIZED', '0');

  const selectedEnvironment = configuration.environments[env];

  if (!host || !port) {
    host = selectedEnvironment.api.address.host;
    port = selectedEnvironment.api.address.port;
  }

  progress({ message: `Waiting for https://${host}:${port}/v1/ping to reply...`, type: 'info' });

  const result = await request({
    url: `https://${host}:${port}/v1/ping`,
    json: true,
    fullResponse: false,
    maxAttempts: 60,
    retryDelay: 2 * 1000,
    retryStrategy: request.RetryStrategies.HTTPOrNetworkError
  });

  restoreEnvironment();

  if (result.api !== 'v1') {
    throw new errors.JsonMalformed();
  }
};

module.exports = waitForApplication;
