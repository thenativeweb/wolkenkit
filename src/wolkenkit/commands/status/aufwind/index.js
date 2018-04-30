'use strict';

const url = require('url');

const request = require('superagent');

const errors = require('../../../../errors'),
      shared = require('../../shared');

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

  const endpoint = url.format({
    protocol: 'http:',
    hostname: tunnel.host,
    port: tunnel.port,
    pathname: `/v1/applications/${configuration.application}/status/${env}`
  });

  progress({ message: `Using ${endpoint} as route.` });

  const response = await request.get(endpoint).send({});

  tunnel.close();

  const applicationStatus = response.body.status;

  if (applicationStatus === 'not-running') {
    throw new errors.ApplicationNotRunning();
  }
};

module.exports = aufwind;
