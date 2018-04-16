'use strict';

const docker = require('../../../docker'),
      runtimes = require('../../runtimes');

const getApplicationStatus = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (options.persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (options.debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { configuration, env, sharedKey, persistData, debug } = options;

  const existingContainers = await docker.getContainers({
    configuration,
    env,
    where: { label: { 'wolkenkit-application': configuration.application }}
  });

  if (existingContainers.length === 0) {
    return 'not-running';
  }

  const runtime = configuration.runtime.version;

  const containers = await runtimes.getContainers({
    forVersion: runtime,
    configuration,
    env,
    sharedKey,
    persistData,
    debug
  });

  if (existingContainers.length < containers.length) {
    return 'partially-running';
  }

  return 'running';
};

module.exports = getApplicationStatus;
