'use strict';

const Course = require('marble-run');

class Dispatcher {
  async initialize ({ concurrency, onDispatch }) {
    if (!concurrency) {
      throw new Error('Concurrency is missing.');
    }
    if (!onDispatch) {
      throw new Error('On dispatch is missing.');
    }

    this.course = new Course({ trackCount: concurrency });
    this.onDispatch = onDispatch;
  }

  async schedule ({ command }) {
    if (!command) {
      throw new Error('Command is missing.');
    }

    const { course, onDispatch } = this;

    // We don't use await here because we are only interested in the fact that
    // the command was stored, not that it was actually handled.
    course.add({
      routingKey: command.aggregate.id,
      id: command.id,
      async task () {
        await onDispatch({ command });
      }
    });
  }
}

module.exports = Dispatcher;
