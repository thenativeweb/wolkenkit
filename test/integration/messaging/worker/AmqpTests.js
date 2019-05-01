'use strict';

const connectionStrings = require('../../../shared/connectionStrings'),
      getTestsFor = require('./getTestsFor'),
      { AmqpDispatcher, AmqpWorker } = require('../../../../messaging/worker');

suite('Amqp', () => {
  getTestsFor({
    Dispatcher: AmqpDispatcher,
    Worker: AmqpWorker,
    type: 'Amqp',

    url: connectionStrings.rabbitMq.integrationTests
  });
});
