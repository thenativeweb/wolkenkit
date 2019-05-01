'use strict';

const getQueue = require('./getQueue');

class InMemoryDispatcher {
  async initialize ({ exchangeName }) {
    if (!exchangeName) {
      throw new Error('Exchange name is missing.');
    }

    this.queue = getQueue({ exchangeName });
  }

  async dispatchMessage ({ message }) {
    this.queue.write({ message });
  }
}

module.exports = InMemoryDispatcher;
