'use strict';

const errors = require('../../../../errors'),
      shared = require('../../shared');

const aufwind = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { directory, env, privateKey, configuration } = options;

  const tunnel = await shared.startTunnel({ configuration, env, privateKey }, progress);

  const application = configuration.application;
  const endpoint = {
    protocol: 'http:',
    method: 'POST',
    hostname: tunnel.host,
    port: tunnel.port,
    pathname: `/v1/applications/${application}/status/${env}`
  };

  const response = await shared.streamApplication({ directory, endpoint, tunnel }, progress);

  switch (response.status) {
    case 'not-running':
      throw new errors.ApplicationNotRunning();
    case 'verifying-connections':
      throw new errors.ApplicationVerifyingConnections();
    case 'building':
      throw new errors.ApplicationBuilding();
    case 'partially-running':
      throw new errors.ApplicationPartiallyRunning();
    case 'terminating':
      throw new errors.ApplicationTerminating();
    case 'running':
      return;
    default:
      throw new Error(`Unknown status '${response.status}'.`);
  }
};

module.exports = aufwind;
