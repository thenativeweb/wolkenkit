'use strict';

const getTestsFor = require('./getTestsFor'),
      { AmqpDispatcher, AmqpWorker } = require('../../../../messaging/worker');

suite('Amqp', () => {
  getTestsFor({
    Dispatcher: AmqpDispatcher,
    Worker: AmqpWorker,
    type: 'amqp'
  });
});
