'use strict';

const axios = require('axios'),
      nodeenv = require('nodeenv'),
      retry = require('async-retry');

const errors = require('../../../errors'),
      switchSemver = require('../../../switchSemver');

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

  const { version } = configuration.application.runtime;

  const restoreEnvironment = nodeenv('NODE_TLS_REJECT_UNAUTHORIZED', '0');

  if (!host || !port) {
    host = configuration.api.host.name;
    port = configuration.api.port;
  }

  await switchSemver(version, {
    async '<= 2.0.0' () {
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
    },

    async default () {
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
    }
  });
};

module.exports = waitForApplication;
