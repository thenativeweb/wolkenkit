'use strict';

const getSharedStream = require('./getSharedStream');

class InMemorySubscriber {
  /* eslint-disable class-methods-use-this */
  async initialize ({ exchangeName, onReceiveMessage }) {
    if (!exchangeName) {
      throw new Error('Exchange name is missing.');
    }
    if (!onReceiveMessage) {
      throw new Error('On receive message is missing.');
    }

    const sharedStream = getSharedStream({ exchangeName });

    sharedStream.on('data', async message => {
      await onReceiveMessage({ message });
    });
  }
  /* eslint-enable class-methods-use-this */
}

module.exports = InMemorySubscriber;
