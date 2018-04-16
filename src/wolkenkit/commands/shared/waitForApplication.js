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

  const restoreEnvironment = nodeenv('NODE_TLS_REJECT_UNAUTHORIZED', '0');

  const result = await request({
    url: `https://${configuration.environments[env].api.address.host}:${configuration.environments[env].api.address.port}/v1/ping`,
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
