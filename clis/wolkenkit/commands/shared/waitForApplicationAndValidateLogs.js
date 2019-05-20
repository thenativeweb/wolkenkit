'use strict';

const validateLogs = require('./validateLogs'),
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

  await new Promise(async (resolve, reject) => {
    let validate;

    try {
      validate = await validateLogs({ configuration }, progress);

      validate.once('error', reject);

      await waitForApplication({
        host: configuration.api.host.name,
        port: configuration.api.port
      }, progress);
    } catch (ex) {
      return reject(ex);
    } finally {
      validate.emit('stop');
    }

    resolve();
  });
};

module.exports = waitForApplicationAndValidateLogs;
