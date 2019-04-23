'use strict';

const aufwind = require('./aufwind'),
      cli = require('./cli'),
      noop = require('../../../noop'),
      shared = require('../../shared');

const stopVia = {
  aufwind,
  cli
};

const stop = async function ({
  directory,
  env,
  port = undefined,
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
    isPackageJsonRequired: true,
    port
  }, progress);

  const { type } = configuration;

  await stopVia[type]({
    configuration,
    directory,
    env,
    port,
    privateKey
  }, progress);
};

module.exports = stop;
