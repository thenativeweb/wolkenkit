'use strict';

const axios = require('axios'),
      nodeenv = require('nodeenv'),
      retry = require('async-retry'),
      semver = require('semver');

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
  const { version } = configuration.runtime;
  let { host, port } = options;

  const restoreEnvironment = nodeenv('NODE_TLS_REJECT_UNAUTHORIZED', '0');

  const selectedEnvironment = configuration.environments[env];

  if (!host || !port) {
    host = selectedEnvironment.api.address.host;
    port = selectedEnvironment.api.address.port;
  }

  if (version !== 'latest' && semver.lte(version, '2.0.0')) {
    progress({ message: `Waiting for https://${host}:${port}/v1/ping to reply...`, type: 'info' });

    const response = await retry(async () => await axios({
      method: 'get',
      url: `https://${host}:${port}/v1/ping`
    }), {
      retries: 60,
      maxTimeout: 2 * 1000
    });

    if (response.data.api !== 'v1') {
      throw new errors.JsonMalformed();
    }

    restoreEnvironment();

    return;
  }

  progress({ message: `Waiting for https://${host}:${port}/ to reply...`, type: 'info' });

  await retry(async () => {
    await axios({
      method: 'get',
      url: `https://${host}:${port}/`
    });
  }, {
    retries: 60,
    maxTimeout: 2 * 1000
  });

  progress({ message: `Running at https://${host}:${port}/`, type: 'info' });

  restoreEnvironment();
};

module.exports = waitForApplication;
