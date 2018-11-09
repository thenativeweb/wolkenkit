'use strict';

const axios = require('axios'),
      nodeenv = require('nodeenv'),
      retry = require('async-retry');

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

  restoreEnvironment();
};

module.exports = waitForApplication;
