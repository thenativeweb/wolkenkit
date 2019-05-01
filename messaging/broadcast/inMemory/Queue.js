'use strict';

const { PassThrough } = require('stream');

class Queue {
  constructor () {
    this.stream = new PassThrough({ objectMode: true });
  }

  register ({ onReceiveMessage }) {
    if (!onReceiveMessage) {
      throw new Error('On receive message is missing.');
    }

    this.stream.on('data', async message => {
      await onReceiveMessage({ message });
    });
  }

  write ({ message }) {
    this.stream.write(message);
  }
}

module.exports = Queue;
