'use strict';

const buntstift = require('buntstift'),
      oneLine = require('common-tags/lib/oneLine'),
      redisClient = require('redis'),
      retry = require('async-retry'),
      shell = require('shelljs');

const getConnectionOptions = require('./getConnectionOptions'),
      getRetryOptions = require('./getRetryOptions');

const redis = {
  async start () {
    const connectionOptions = getConnectionOptions();

    const {
      hostname,
      port,
      password
    } = connectionOptions.redis;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:6379
        --name test-redis
        thenativeweb/wolkenkit-redis:latest
        redis-server --requirepass ${password}
    `);

    const url = `redis://:${password}@${hostname}:${port}/0`;

    try {
      await retry(() => new Promise((resolve, reject) => {
        const client = redisClient.createClient({ url });

        client.ping(err => {
          if (err) {
            reject(err);
          }

          client.quit();
          resolve();
        });
      }), getRetryOptions());
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to Redis.');
      throw ex;
    }
  },

  async stop () {
    shell.exec([
      'docker kill test-redis',
      'docker rm -v test-redis'
    ].join(';'));
  }
};

module.exports = redis;
