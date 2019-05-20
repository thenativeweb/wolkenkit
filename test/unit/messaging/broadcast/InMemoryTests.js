'use strict';

const getTestsFor = require('./getTestsFor'),
      { InMemoryPublisher, InMemorySubscriber } = require('../../../../messaging/broadcast');

suite('InMemory', () => {
  getTestsFor({
    Publisher: InMemoryPublisher,
    Subscriber: InMemorySubscriber,
    type: 'inmemory'
  });
});
