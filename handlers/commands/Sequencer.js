'use strict';

const Course = require('marble-run');

class Sequencer {
  constructor ({ concurrency, onHandle }) {
    if (!concurrency) {
      throw new Error('Concurrency is missing.');
    }
    if (!onHandle) {
      throw new Error('On handle is missing.');
    }

    this.course = new Course({ trackCount: concurrency });
    this.onHandle = onHandle;
  }

  async add ({ command }) {
    if (!command) {
      throw new Error('Command is missing.');
    }

    const { course, onHandle } = this;

    await course.add({
      routingKey: command.aggregate.id,
      id: command.id,
      async task () {
        await onHandle({ command });
      }
    });
  }
}

module.exports = Sequencer;
