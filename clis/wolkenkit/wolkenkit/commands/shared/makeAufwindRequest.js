'use strict';

const { PassThrough } = require('stream'),
      url = require('url');

const axios = require('axios'),
      NewlineJsonParser = require('newline-json').Parser,
      pump = require('pump');

const errors = require('../../../errors');

const makeAufwindRequest = async function ({
  endpoint,
  tunnel,
  uploadStream = undefined
}, progress) {
  if (!endpoint) {
    throw new Error('Endpoint is missing.');
  }
  if (!tunnel) {
    throw new Error('Tunnel is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const formattedUrl = url.format(endpoint);
  let receivedData;

  progress({ message: `Using ${endpoint.method} ${formattedUrl} as route.` });

  try {
    const response = await axios({
      method: endpoint.method.toLowerCase(),
      url: formattedUrl,
      headers: endpoint.headers,
      data: uploadStream || '',
      responseType: 'stream'
    });

    const newlineJsonParser = new NewlineJsonParser();
    const passThrough = new PassThrough({ objectMode: true });

    pump(response.data, newlineJsonParser, passThrough);

    let hasError = false;

    for await (const data of passThrough) {
      if (data.type === 'heartbeat') {
        continue;
      }

      if (!data.message || !data.type) {
        receivedData = data;

        continue;
      }

      if (data.type === 'error') {
        hasError = true;
        data.type = 'info';
      }

      progress(data);
    }

    if (hasError) {
      throw new errors.RequestFailed();
    }
  } finally {
    tunnel.close();
  }

  return receivedData;
};

module.exports = makeAufwindRequest;
