'use strict';

const aufwind = require('./aufwind'),
      cli = require('./cli'),
      noop = require('../../../noop'),
      shared = require('../shared');

const restartVia = {
  aufwind,
  cli
};

const restart = async function ({
  directory,
  env,
  privateKey = undefined
}, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }

  const configuration = await shared.getConfiguration({
    directory,
    env,
    isPackageJsonRequired: true
  }, progress);

  const { type } = configuration;

  await restartVia[type]({
    configuration,
    directory,
    env,
    privateKey
  }, progress);
};

module.exports = restart;
