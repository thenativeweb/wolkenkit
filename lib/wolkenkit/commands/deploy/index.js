'use strict';

const os = require('os'),
      path = require('path'),
      url = require('url');

const processenv = require('processenv'),
      request = require('superagent'),
      tar = require('tar');

const errors = require('../../../errors'),
      file = require('../../../file'),
      noop = require('../../../noop'),
      shared = require('../shared'),
      startTunnel = require('./startTunnel');

const deploy = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.server) {
    throw new Error('Server is missing.');
  }

  const { env, directory, server } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true
  }, progress);

  const username = processenv('WOLKENKIT_USERNAME');

  if (!username) {
    throw new errors.EnvironmentNotFound('Environment WOLKENKIT_USERNAME not found.');
  }

  const homeDirectory = os.homedir();
  const privateKey = await file.read(path.join(homeDirectory, '.ssh', 'id_rsa'));

  const tunnel = await startTunnel({ privateKey, server, username }, progress);

  const endpoint = url.format({
    protocol: 'http:',
    hostname: tunnel.host,
    port: tunnel.port,
    pathname: '/v1/deploy'
  });

  await new Promise((resolve, reject) => {
    const tarStream = tar.create({
      gzip: true,
      cwd: directory,
      strict: true
    }, [ 'package.json', 'server' ]);

    const req = request.
      post(endpoint).
      query({ application: configuration.application }).
      type('application/gzip').
      on('error', err => {
        reject(err);
      }).
      on('response', () => {
        resolve();
      });

    tarStream.
      on('error', err => {
        reject(err);
      }).
      pipe(req);
  });

  progress({ message: `Posted tar file to ${server}` });

  tunnel.close();

  progress({ message: `SSH-Tunnel closed.` });
};

module.exports = deploy;
