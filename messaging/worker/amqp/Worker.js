'use strict';

const amqp = require('amqplib');

class AmqpWorker {
  /* eslint-disable class-methods-use-this */
  async initialize ({ url, exchangeName, concurrency = 1, onReceiveMessage }) {
    if (!url) {
      throw new Error('Url is missing.');
    }
    if (!exchangeName) {
      throw new Error('Exchange name is missing.');
    }
    if (!onReceiveMessage) {
      throw new Error('On receive message is missing.');
    }

    const connection = await amqp.connect(url, {});

    connection.on('error', err => {
      throw err;
    });
    connection.on('close', () => {
      throw new Error('Connection closed unexpectedly.');
    });

    const channel = await connection.createChannel();

    channel.on('error', err => {
      throw err;
    });
    channel.on('close', () => {
      throw new Error('Channel closed unexpectedly.');
    });

    channel.prefetch(concurrency);

    await channel.assertExchange(exchangeName, 'direct', { durable: true });

    const { queue } = await channel.assertQueue(exchangeName, { durable: true });

    await channel.bindQueue(exchangeName, exchangeName, '', {});

    await channel.consume(queue, async message => {
      const parsedMessage = JSON.parse(message.content.toString('utf8'));

      await onReceiveMessage({ message: parsedMessage });

      channel.ack(message);
    });
  }
  /* eslint-enable class-methods-use-this */
}

module.exports = AmqpWorker;
