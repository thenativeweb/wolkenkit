'use strict';

const Minio = require('minio'),
      oneLine = require('common-tags/lib/oneLine'),
      retry = require('async-retry'),
      shell = require('shelljs'),
      uuid = require('uuidv4');

const getConnectionOptions = require('./getConnectionOptions');

const minio = {
  async start () {
    const connectionOptions = getConnectionOptions();

    const {
      hostname,
      port,
      accessKey,
      secretKey,
      encryptConnection
    } = connectionOptions.minio;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:9000
        -e "MINIO_ACCESS_KEY=${accessKey}"
        -e "MINIO_SECRET_KEY=${secretKey}"
        --name test-minio
        minio/minio:latest
        server
        /data
    `);

    await retry(async () => {
      const client = new Minio.Client({
        endPoint: hostname,
        port,
        useSSL: encryptConnection,
        accessKey,
        secretKey
      });

      await client.bucketExists(uuid());
    });
  },

  async stop () {
    shell.exec([
      'docker kill test-minio',
      'docker rm -v test-minio'
    ].join(';'));
  }
};

module.exports = minio;
