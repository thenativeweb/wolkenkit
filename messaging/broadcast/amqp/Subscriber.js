'use strict';

const amqp = require('amqplib');

class AmqpSubscriber {
  /* eslint-disable class-methods-use-this */
  async initialize ({ hostname, port, username, password, exchangeName, onReceiveMessage }) {
    if (!hostname) {
      throw new Error('Hostname is missing.');
    }
    if (!port) {
      throw new Error('Port is missing.');
    }
    if (!username) {
      throw new Error('Username is missing.');
    }
    if (!password) {
      throw new Error('Password is missing.');
    }
    if (!exchangeName) {
      throw new Error('Exchange name is missing.');
    }
    if (!onReceiveMessage) {
      throw new Error('On receive message is missing.');
    }

    const url = `amqp://${username}:${password}@${hostname}:${port}`;
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

    channel.prefetch(1);

    await channel.assertExchange(exchangeName, 'fanout', {
      durable: true
    });

    const { queue } = await channel.assertQueue('', {
      autoDelete: true,
      exclusive: true
    });

    await channel.bindQueue(queue, exchangeName, '', {});

    await channel.consume(queue, async message => {
      const parsedMessage = JSON.parse(message.content.toString('utf8'));

      await onReceiveMessage({ message: parsedMessage });

      channel.ack(message);
    });
  }
  /* eslint-enable class-methods-use-this */
}

module.exports = AmqpSubscriber;
