'use strict';

const getSharedStream = require('./getSharedStream');

class InMemoryPublisher {
  async initialize ({ exchangeName }) {
    if (!exchangeName) {
      throw new Error('Exchange name is missing.');
    }

    this.sharedStream = getSharedStream({ exchangeName });
  }

  async publishMessage ({ message }) {
    this.sharedStream.write(message);
  }
}

module.exports = InMemoryPublisher;
