'use strict';

const amqp = require('amqplib');

class AmqpPublisher {
  async initialize ({ url, exchangeName }) {
    if (!url) {
      throw new Error('Url is missing.');
    }
    if (!exchangeName) {
      throw new Error('Exchange name is missing.');
    }

    this.exchangeName = exchangeName;

    const connection = await amqp.connect(url, {});

    connection.on('error', err => {
      throw err;
    });
    connection.on('close', () => {
      throw new Error('Connection closed unexpectedly.');
    });

    this.channel = await connection.createChannel();
    this.channel.on('error', err => {
      throw err;
    });
    this.channel.on('close', () => {
      throw new Error('Channel closed unexpectedly.');
    });

    this.channel.prefetch(1);

    await this.channel.assertExchange(this.exchangeName, 'fanout', {
      durable: true
    });
  }

  async publishMessage ({ message }) {
    const buffer = Buffer.from(JSON.stringify(message));

    this.channel.publish(this.exchangeName, '', buffer, 'utf8', {
      persistent: true
    });
  }
}

module.exports = AmqpPublisher;
