'use strict';

const path = require('path'),
      { PassThrough } = require('stream');

const pump = require('pump'),
      tar = require('tar');

const file = require('../../../file'),
      makeAufwindRequest = require('./makeAufwindRequest');

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

  const response = await new Promise(async (resolve, reject) => {
    endpoint.headers = {
      'content-type': 'application/gzip'
    };

    const files = [ 'package.json', 'server' ];

    const secretFileName = 'wolkenkit-secrets.json';

    if (await file.exists(path.join(directory, secretFileName))) {
      files.push(secretFileName);
    }

    const tarStream = tar.create({
      gzip: true,
      cwd: directory,
      strict: true
    }, files);

    const uploadStream = new PassThrough();

    // Pump tar stream into a pass through stream, since tar stream is not a
    // real stream and the upload doesn't work otherwise.
    pump(tarStream, uploadStream, () => {
      progress({ message: `Uploaded .tar.gz file.` });
    });

    let receivedData;

    try {
      receivedData = await makeAufwindRequest({ endpoint, tunnel, uploadStream }, progress);
    } catch (ex) {
      return reject(ex);
    }

    resolve(receivedData);
  });

  return response;
};

module.exports = streamApplication;
