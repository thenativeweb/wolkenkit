'use strict';

const aufwind = require('./aufwind'),
      cli = require('./cli'),
      noop = require('../../../noop'),
      shared = require('../shared');

const statusVia = {
  aufwind,
  cli
};

const status = async function ({
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

  await statusVia[type]({
    configuration,
    directory,
    env,
    privateKey
  }, progress);
};

module.exports = status;
