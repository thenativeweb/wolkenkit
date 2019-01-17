'use strict';

const shared = require('../../shared');

const aufwind = async function ({
  configuration,
  directory,
  env,
  privateKey = undefined
}, progress) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  progress({ message: `Deploying application to aufwind...`, type: 'info' });
  const tunnel = await shared.startTunnel({
    configuration,
    privateKey
  }, progress);

  const applicationName = configuration.application.name;
  const endpoint = {
    protocol: 'http:',
    method: 'POST',
    hostname: tunnel.host,
    port: tunnel.port,
    pathname: `/v1/applications/${applicationName}/restart/${env}`
  };

  await shared.streamApplication({ directory, endpoint, tunnel }, progress);
};

module.exports = aufwind;
