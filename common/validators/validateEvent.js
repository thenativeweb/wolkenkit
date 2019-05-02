'use strict';

const Value = require('validate-value');

const { Event } = require('../elements');

const validateEvent = function ({ event, application }) {
  if (!event) {
    throw new Error('Event is missing.');
  }
  if (!application) {
    throw new Error('Application is missing.');
  }

  if (!Event.isWellformed(event)) {
    throw new Error('Malformed event.');
  }

  const context = application.events.internal[event.context.name];

  if (!context) {
    throw new Error('Invalid context name.');
  }

  const aggregate = context[event.aggregate.name];

  if (!aggregate) {
    throw new Error('Invalid aggregate name.');
  }

  if (!aggregate[event.name]) {
    throw new Error('Invalid event name.');
  }

  const { schema } = aggregate[event.name];

  if (!schema) {
    return;
  }

  const value = new Value(schema);

  value.validate(event.data, { valueName: 'event.data' });
};

module.exports = validateEvent;
