'use strict';

const docker = require('../../../docker'),
      runtimes = require('../../runtimes');

const getApplicationStatus = async function ({
  configuration,
  env,
  sharedKey,
  persistData,
  dangerouslyExposeHttpPorts,
  debug
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (dangerouslyExposeHttpPorts === undefined) {
    throw new Error('Dangerously expose http ports is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

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
    dangerouslyExposeHttpPorts,
    debug
  });

  if (existingContainers.length < containers.length) {
    return 'partially-running';
  }

  return 'running';
};

module.exports = getApplicationStatus;
