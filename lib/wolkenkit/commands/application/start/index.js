'use strict';

const aufwind = require('./aufwind'),
      cli = require('./cli'),
      noop = require('../../../../noop'),
      shared = require('../../shared');

const startVia = {
  aufwind,
  cli
};

const start = async function ({
  directory,
  dangerouslyExposeHttpPorts,
  debug,
  env,
  port,
  privateKey
}, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
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
    dangerouslyExposeHttpPorts,
    debug,
    directory,
    env,
    port,
    privateKey
  }, progress);
};

module.exports = start;
