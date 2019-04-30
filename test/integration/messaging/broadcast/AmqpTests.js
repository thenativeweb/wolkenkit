'use strict';

const connectionStrings = require('../../../shared/connectionStrings'),
      getTestsFor = require('./getTestsFor'),
      { AmqpPublisher, AmqpSubscriber } = require('../../../../messaging/broadcast');

suite('Amqp', () => {
  getTestsFor({
    Publisher: AmqpPublisher,
    Subscriber: AmqpSubscriber,
    type: 'Amqp',

    url: connectionStrings.rabbitMq.integrationTests
  });
});
