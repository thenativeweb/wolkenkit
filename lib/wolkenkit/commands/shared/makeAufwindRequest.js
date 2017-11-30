'use strict';

const http = require('http'),
      url = require('url');

const NewlineJsonParser = require('newline-json').Parser;

const errors = require('../../../errors');

const makeAufwindRequest = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
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

  const { endpoint, tunnel, uploadStream } = options;

  const formattedUrl = url.format(endpoint);

  progress({ message: `Using ${endpoint.method} ${formattedUrl} as route.` });

  const requestOptions = url.parse(formattedUrl);

  requestOptions.method = endpoint.method;

  const responseData = await new Promise((resolve, reject) => {
    const request = http.request(requestOptions, response => {
      const newlineJsonparser = new NewlineJsonParser();

      let hasError = false,
          receivedData,
          unsubscribe;

      const onData = function (data) {
        if (!data.message || !data.type) {
          receivedData = data;

          return;
        }

        if (data.type === 'error') {
          hasError = true;
          data.type = 'info';
        }

        progress(data);
      };

      const onEnd = function () {
        unsubscribe();
        tunnel.close();

        if (hasError) {
          return reject(new errors.RequestFailed());
        }

        resolve(receivedData);
      };

      const onError = function (err) {
        unsubscribe();
        tunnel.close();
        reject(err);
      };

      unsubscribe = function () {
        newlineJsonparser.
          removeListener('data', onData).
          removeListener('end', onEnd).
          removeListener('error', onError);
      };

      newlineJsonparser.
        on('data', onData).
        on('end', onEnd).
        on('error', onError);

      response.
        pipe(newlineJsonparser);
    });

    if (!uploadStream) {
      return request.end();
    }

    uploadStream.
      on('error', err => {
        tunnel.close();

        reject(err);
      }).
      pipe(request);
  });

  return responseData;
};

module.exports = makeAufwindRequest;
