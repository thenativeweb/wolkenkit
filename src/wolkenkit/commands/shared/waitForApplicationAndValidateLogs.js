'use strict';

const switchSemver = require('../../../switchSemver'),
      validateLogs = require('./validateLogs'),
      waitForApplication = require('./waitForApplication');

const waitForApplicationAndValidateLogs = async function (options, progress) {
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

  await switchSemver(version, {
    async '<= 2.0.0' () {
      await waitForApplication({ configuration, env }, progress);
    },

    async default () {
      await new Promise(async (resolve, reject) => {
        let validate;

        try {
          validate = await validateLogs({ configuration, env }, progress);

          validate.once('error', reject);

          await waitForApplication({ configuration, env }, progress);
        } catch (ex) {
          return reject(ex);
        } finally {
          validate.emit('stop');
        }

        resolve();
      });
    }
  });
};

module.exports = waitForApplicationAndValidateLogs;
