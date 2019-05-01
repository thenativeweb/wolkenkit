'use strict';

const AmqpDispatcher = require('./amqp/Dispatcher'),
      AmqpWorker = require('./amqp/Worker'),
      InMemoryDispatcher = require('./inMemory/Dispatcher'),
      InMemoryWorker = require('./inMemory/Worker');

module.exports = {
  AmqpDispatcher,
  AmqpWorker,
  InMemoryDispatcher,
  InMemoryWorker
};
