'use strict';

const runtimes = require('../../../../runtimes'),
      shared = require('../../../shared');

const buildImages = async function ({ configuration, directory }, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const runtimeVersion = configuration.application.runtime.version;

  const images = await runtimes.getApplicationImages({ forVersion: runtimeVersion });

  await shared.buildImages({ configuration, directory, images }, progress);
};

module.exports = buildImages;
