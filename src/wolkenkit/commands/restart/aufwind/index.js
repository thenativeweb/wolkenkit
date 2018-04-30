'use strict';

const shared = require('../../shared');

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

  progress({ message: `Deploying application to aufwind...`, type: 'info' });
  const tunnel = await shared.startTunnel({ configuration, env, privateKey }, progress);

  const application = configuration.application;
  const endpoint = {
    protocol: 'http:',
    method: 'POST',
    hostname: tunnel.host,
    port: tunnel.port,
    pathname: `/v1/applications/${application}/restart/${env}`
  };

  await shared.streamApplication({ directory, endpoint, tunnel }, progress);
};

module.exports = aufwind;
