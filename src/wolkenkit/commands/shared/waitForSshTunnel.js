'use strict';

const axios = require('axios'),
      retry = require('async-retry');

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
};

module.exports = waitForSshTunnel;
