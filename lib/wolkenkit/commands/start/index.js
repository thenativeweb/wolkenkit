'use strict';

const aufwind = require('./aufwind'),
      cli = require('./cli'),
      noop = require('../../../noop'),
      shared = require('../shared');

const startVia = {
  aufwind,
  cli
};

const start = async function ({
  directory,
  dangerouslyDestroyData,
  dangerouslyExposeHttpPorts,
  debug,
  env,
  persist,
  port,
  privateKey,
  sharedKey
}, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
  }
  if (dangerouslyExposeHttpPorts === undefined) {
    throw new Error('Dangerously expose http ports is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (persist === undefined) {
    throw new Error('Persist is missing.');
  }

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true,
    port
  }, progress);

  await shared.validateCode({ directory }, progress);

  const { type } = configuration;

  await startVia[type]({
    configuration,
    dangerouslyDestroyData,
    dangerouslyExposeHttpPorts,
    debug,
    directory,
    env,
    persist,
    port,
    privateKey,
    sharedKey
  }, progress);
};

module.exports = start;
