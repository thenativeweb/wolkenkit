'use strict';

const axios = require('axios'),
      nodeenv = require('nodeenv'),
      retry = require('async-retry');

const waitForApplication = async function ({
  configuration,
  host = undefined,
  port = undefined
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const restoreEnvironment = nodeenv('NODE_TLS_REJECT_UNAUTHORIZED', '0');

  if (!host || !port) {
    host = configuration.api.host.name;
    port = configuration.api.port;
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
