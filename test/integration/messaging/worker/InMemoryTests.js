'use strict';

const getTestsFor = require('./getTestsFor'),
      { InMemoryDispatcher, InMemoryWorker } = require('../../../../messaging/worker');

suite('InMemory', () => {
  getTestsFor({
    Dispatcher: InMemoryDispatcher,
    Worker: InMemoryWorker,

    getOptions () {
      return {};
    }
  });
});
