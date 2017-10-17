'use strict';

const request = require('superagent'),
      tar = require('tar');

const noop = require('../../../noop'),
      shared = require('../shared');

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

  await new Promise((resolve, reject) => {
    const tarStream = tar.create({
      gzip: true,
      cwd: directory,
      strict: true
    }, [ 'package.json', 'server' ]);

    const req = request.
      post(server).
      type('application/gzip').
      on('error', err => {
        reject(err);
      }).
      on('response', () => {
        progress({ message: `Posted tar file to ${server}` });
        resolve();
      });

    tarStream.
      on('error', err => {
        reject(err);
      }).
      pipe(req);
  });
};

module.exports = deploy;
