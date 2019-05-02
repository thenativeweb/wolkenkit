'use strict';

const getConnectionOptions = require('../../../shared/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { AmqpPublisher, AmqpSubscriber } = require('../../../../messaging/broadcast');

suite('Amqp', () => {
  getTestsFor({
    Publisher: AmqpPublisher,
    Subscriber: AmqpSubscriber,

    getOptions () {
      const { rabbitMq } = getConnectionOptions({ type: 'integration' });

      return rabbitMq;
    }
  });
});
