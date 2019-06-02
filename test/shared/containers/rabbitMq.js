'use strict';

const amqp = require('amqplib'),
      buntstift = require('buntstift'),
      oneLine = require('common-tags/lib/oneLine'),
      retry = require('async-retry'),
      shell = require('shelljs');

const getConnectionOptions = require('./getConnectionOptions'),
      getRetryOptions = require('./getRetryOptions');

const rabbitMq = {
  async start () {
    const connectionOptions = getConnectionOptions();

    const {
      hostname,
      port,
      username,
      password
    } = connectionOptions.rabbitMq;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:5672
        -e RABBITMQ_DEFAULT_USER=${username}
        -e RABBITMQ_DEFAULT_PASS=${password}
        --name test-rabbitmq
        thenativeweb/wolkenkit-rabbitmq:latest
    `);

    const url = `amqp://${username}:${password}@${hostname}:${port}`;

    try {
      await retry(async () => {
        const connection = await amqp.connect(url, {});

        await connection.close();
      }, getRetryOptions());
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to RabbitMQ.');
      throw ex;
    }
  },

  async stop () {
    shell.exec([
      'docker kill test-rabbitmq',
      'docker rm -v test-rabbitmq'
    ].join(';'));
  }
};

module.exports = rabbitMq;
