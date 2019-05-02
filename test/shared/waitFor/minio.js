'use strict';

const Minio = require('minio'),
      retry = require('async-retry'),
      uuid = require('uuidv4');

const waitForMinio = async function ({ endpoint, port, useSsl, accessKey, secretKey }) {
  if (!endpoint) {
    throw new Error('Endpoint is missing.');
  }
  if (!port) {
    throw new Error('Port is missing.');
  }
  if (useSsl === undefined) {
    throw new Error('Use ssl is missing.');
  }
  if (!accessKey) {
    throw new Error('Access key is missing.');
  }
  if (!secretKey) {
    throw new Error('Secret key is missing.');
  }

  await retry(async () => {
    const client = new Minio.Client({
      endPoint: endpoint,
      port,
      useSSL: useSsl,
      accessKey,
      secretKey
    });

    await client.bucketExists(uuid());
  });
};

module.exports = waitForMinio;
