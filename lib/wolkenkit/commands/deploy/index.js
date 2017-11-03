'use strict';

const url = require('url');

const request = require('superagent'),
      tar = require('tar');

const errors = require('../../../errors'),
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

  const username = 'wolkenkit';

  const tunnel = await startTunnel({ server, username }, progress);

  const endpoint = url.format({
    protocol: 'http:',
    hostname: tunnel.host,
    port: tunnel.port,
    pathname: '/v1/deploy'
  });

  progress({ message: `Using ${endpoint} as route.` });
  progress({ message: `Uploading .tar.gz file...` });

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
        tunnel.close();

        reject(err);
      }).
      on('response', res => {
        if (res.statusCode !== 200) {
          tunnel.close();

          progress({ message: 'Failed to upload .tar.gz file.', type: 'info' });

          return reject(new errors.RequestFailed(res.text));
        }

        resolve();
      });

    tarStream.
      on('error', err => {
        tunnel.close();

        reject(err);
      }).
      pipe(req);
  });

  progress({ message: `Uploaded .tar.gz file.` });

  tunnel.close();

  progress({ message: 'Closed SSH tunnel.' });
};

module.exports = deploy;
