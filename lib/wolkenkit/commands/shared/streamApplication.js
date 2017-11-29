'use strict';

const request = require('superagent'),
      tar = require('tar');

const errors = require('../../../errors');

const streamApplication = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.endpoint) {
    throw new Error('Endpoint is missing.');
  }
  if (!options.tunnel) {
    throw new Error('Tunnel is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { directory, endpoint, tunnel } = options;

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
};

module.exports = streamApplication;
