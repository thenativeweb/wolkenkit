'use strict';

const tar = require('tar');

const makeAufwindRequest = require('./makeAufwindRequest');

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

  progress({ message: `Uploading .tar.gz file...` });

  await new Promise(async (resolve, reject) => {
    endpoint.headers = {
      'content-type': 'application/gzip'
    };

    const tarStream = tar.create({
      gzip: true,
      cwd: directory,
      strict: true
    }, [ 'package.json', 'server' ]);

    tarStream.
      on('end', () => {
        progress({ message: `Uploaded .tar.gz file.` });
      });

    try {
      await makeAufwindRequest({ endpoint, tunnel, uploadStream: tarStream }, progress);
    } catch (ex) {
      return reject(ex);
    }

    resolve();
  });
};

module.exports = streamApplication;
