'use strict';

const getTestsFor = require('./getTestsFor'),
      { AmqpPublisher, AmqpSubscriber } = require('../../../../messaging/broadcast');

suite('Amqp', () => {
  getTestsFor({
    Publisher: AmqpPublisher,
    Subscriber: AmqpSubscriber,
    type: 'amqp'
  });
});
