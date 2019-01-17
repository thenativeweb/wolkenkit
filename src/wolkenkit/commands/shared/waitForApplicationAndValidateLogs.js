'use strict';

const switchSemver = require('../../../switchSemver'),
      validateLogs = require('./validateLogs'),
      waitForApplication = require('./waitForApplication');

const waitForApplicationAndValidateLogs = async function ({
  configuration
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }
  const { version } = configuration.application.runtime;

  await switchSemver(version, {
    async '<= 2.0.0' () {
      await waitForApplication({ configuration }, progress);
    },

    async default () {
      await new Promise(async (resolve, reject) => {
        let validate;

        try {
          validate = await validateLogs({ configuration }, progress);

          validate.once('error', reject);

          await waitForApplication({ configuration }, progress);
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
