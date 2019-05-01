'use strict';

const getQueue = require('./getQueue');

class InMemoryWorker {
  /* eslint-disable class-methods-use-this */
  async initialize ({ exchangeName, onReceiveMessage }) {
    if (!exchangeName) {
      throw new Error('Exchange name is missing.');
    }
    if (!onReceiveMessage) {
      throw new Error('On receive message is missing.');
    }

    const queue = getQueue({ exchangeName });

    queue.register({ onReceiveMessage });
  }
  /* eslint-enable class-methods-use-this */
}

module.exports = InMemoryWorker;
