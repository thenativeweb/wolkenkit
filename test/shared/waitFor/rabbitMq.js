'use strict';

const amqp = require('amqplib'),
      retry = require('async-retry');

const waitForRabbitMq = async function ({ url }) {
  if (!url) {
    throw new Error('Url is missing.');
  }

  await retry(async () => {
    const connection = await amqp.connect(url, {});

    await connection.close();
  });
};

module.exports = waitForRabbitMq;
