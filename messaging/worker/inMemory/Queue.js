'use strict';

const { PassThrough } = require('stream');

class Queue {
  constructor () {
    this.receivers = [];
    this.currentReceiver = 0;

    this.stream = new PassThrough({ objectMode: true });
  }

  register ({ onReceiveMessage }) {
    if (!onReceiveMessage) {
      throw new Error('On receive message is missing.');
    }

    this.receivers.push(onReceiveMessage);

    if (this.receivers.length > 1) {
      return;
    }

    this.stream.on('data', async message => {
      if (this.receivers.length === 0) {
        return;
      }

      await this.receivers[this.currentReceiver]({ message });

      this.currentReceiver = (this.currentReceiver + 1) % this.receivers.length;
    });
  }

  write ({ message }) {
    this.stream.write(message);
  }
}

module.exports = Queue;
