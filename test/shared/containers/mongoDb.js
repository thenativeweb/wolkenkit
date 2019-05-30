'use strict';

const buntstift = require('buntstift'),
      { MongoClient } = require('mongodb'),
      oneLine = require('common-tags/lib/oneLine'),
      retry = require('async-retry'),
      shell = require('shelljs');

const getConnectionOptions = require('./getConnectionOptions'),
      getRetryOptions = require('./getRetryOptions');

const mongoDb = {
  async start () {
    const connectionOptions = getConnectionOptions();

    const {
      hostname,
      port,
      username,
      password,
      database
    } = connectionOptions.mongoDb;

    shell.exec(oneLine`
      docker run
        -d
        -p 27017:27017
        -e MONGODB_DATABASE=${database}
        -e MONGODB_USER=${username}
        -e MONGODB_PASS=${password}
        --name test-mongodb
        thenativeweb/wolkenkit-mongodb:latest
    `);

    const url = `mongodb://${username}:${password}@${hostname}:${port}/${database}`;

    try {
      await retry(async () => {
        /* eslint-disable id-length */
        const client = await MongoClient.connect(url, { w: 1, useNewUrlParser: true });
        /* eslint-enable id-length */

        await client.close();
      }, getRetryOptions());
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to MongoDB.');
      throw ex;
    }
  },

  async stop () {
    shell.exec([
      'docker kill test-mongodb',
      'docker rm -v test-mongodb'
    ].join(';'));
  }
};

module.exports = mongoDb;
