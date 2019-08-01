'use strict';

const image = require('./image');

const volume = function ({ configuration, secret }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!secret) {
    throw new Error('Secret is missing.');
  }

  const result = {
    name: `${configuration.application.name}-postgres-volume`,
    labels: {
      'wolkenkit-application': configuration.application.name,
      'wolkenkit-secret': secret,
      'wolkenkit-type': image().type
    }
  };

  return result;
};

module.exports = volume;
