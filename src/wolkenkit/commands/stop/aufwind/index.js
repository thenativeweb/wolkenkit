'use strict';

const shared = require('../../shared');

const aufwind = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
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

  const { env, privateKey, configuration } = options;

  const tunnel = await shared.startTunnel({ configuration, env, privateKey }, progress);

  const application = configuration.application;
  const endpoint = {
    protocol: 'http:',
    method: 'POST',
    hostname: tunnel.host,
    port: tunnel.port,
    pathname: `/v1/applications/${application}/stop/${env}`
  };

  await shared.makeAufwindRequest({ endpoint, tunnel }, progress);
};

module.exports = aufwind;
