'use strict';

const aufwind = require('./aufwind'),
      cli = require('./cli'),
      noop = require('../../../noop'),
      shared = require('../shared');

const stopVia = {
  aufwind,
  cli
};

const stop = async function ({
  dangerouslyDestroyData,
  directory,
  env,
  port = undefined,
  privateKey = undefined
}, progress = noop) {
  if (dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }

  const configuration = await shared.getConfiguration({
    directory,
    env,
    isPackageJsonRequired: true,
    port
  }, progress);

  const { type } = configuration;

  await stopVia[type]({
    configuration,
    dangerouslyDestroyData,
    directory,
    env,
    port,
    privateKey
  }, progress);
};

module.exports = stop;
