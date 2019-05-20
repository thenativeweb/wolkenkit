'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { AmqpPublisher, AmqpSubscriber } = require('../../../../messaging/broadcast');

suite('Amqp', () => {
  getTestsFor({
    Publisher: AmqpPublisher,
    Subscriber: AmqpSubscriber,

    getOptions () {
      const { rabbitMq } = getConnectionOptions();

      return rabbitMq;
    }
  });
});
