'use strict';

const { PassThrough } = require('stream');

class Queue {
  constructor () {
    this.receivers = [];
    this.stream = new PassThrough({ objectMode: true });

    let receiverCounter = 0;

    this.stream.on('data', async message => {
      if (this.receivers.length === 0) {
        return;
      }

      await this.receivers[receiverCounter]({ message });

      receiverCounter = (receiverCounter + 1) % this.receivers.length;
    });
  }

  register ({ onReceiveMessage }) {
    if (!onReceiveMessage) {
      throw new Error('On receive message is missing.');
    }

    this.receivers.push(onReceiveMessage);
  }

  write ({ message }) {
    this.stream.write(message);
  }
}

module.exports = Queue;
