'use strict';

const uuid = require('uuidv4'),
      Value = require('validate-value');

const uuidRegex = uuid.regex.v4.toString().slice(1, -1);

const value = new Value({
  type: 'object',
  properties: {
    context: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, format: 'alphanumeric' }
      },
      required: [ 'name' ],
      additionalProperties: false
    },
    aggregate: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, format: 'alphanumeric' },
        id: { type: 'string', pattern: uuidRegex }
      },
      required: [ 'name', 'id' ],
      additionalProperties: false
    },
    name: { type: 'string', minLength: 1, format: 'alphanumeric' },
    id: { type: 'string', pattern: uuidRegex },
    data: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: true
    },
    custom: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: true
    },
    initiator: {
      oneOf: [
        {
          type: 'null'
        },
        {
          type: 'object',
          properties: {
            id: { type: 'string', minLength: 1 }
          },
          required: [ 'id' ],
          additionalProperties: false
        }
      ]
    },
    metadata: {
      type: 'object',
      properties: {
        timestamp: { type: 'number' },
        published: { type: 'boolean' },
        correlationId: { type: 'string', pattern: uuidRegex },
        causationId: { type: 'string', pattern: uuidRegex }
      },
      required: [ 'timestamp', 'published', 'correlationId', 'causationId' ],
      additionalProperties: true
    },
    type: { type: 'string', minLength: 1 }
  },
  required: [ 'context', 'aggregate', 'name', 'id', 'data', 'custom', 'metadata', 'type' ],
  additionalProperties: false
});

class Event {
  constructor ({ context, aggregate, name, metadata, type = 'domain', data = {}, custom = {}}) {
    if (!context) {
      throw new Error('Context is missing.');
    }
    if (!context.name) {
      throw new Error('Context name is missing.');
    }
    if (!aggregate) {
      throw new Error('Aggregate is missing.');
    }
    if (!aggregate.name) {
      throw new Error('Aggregate name is missing.');
    }
    if (!aggregate.id) {
      throw new Error('Aggregate id is missing.');
    }
    if (!name) {
      throw new Error('Event name is missing.');
    }
    if (!metadata) {
      throw new Error('Metadata are missing.');
    }
    if (!metadata.correlationId) {
      throw new Error('Correlation id is missing.');
    }
    if (!metadata.causationId) {
      throw new Error('Causation id is missing.');
    }

    this.context = { name: context.name };
    this.aggregate = { name: aggregate.name, id: aggregate.id };
    this.name = name;
    this.id = uuid();
    this.type = type;

    this.data = data;
    this.custom = custom;
    this.initiator = null;
    this.metadata = {
      timestamp: (new Date()).getTime(),
      published: false,
      correlationId: metadata.correlationId,
      causationId: metadata.causationId
    };

    value.validate(this, { valueName: 'event' });
  }

  addInitiator (initiator) {
    if (!initiator) {
      throw new Error('Initiator is missing.');
    }
    if (!initiator.id) {
      throw new Error('Initiator id is missing.');
    }

    this.initiator = {
      id: initiator.id
    };
  }

  static deserialize ({
    context,
    aggregate,
    name,
    id,
    initiator,
    metadata,
    type,
    data,
    custom
  }) {
    const event = new Event({ context, aggregate, name, metadata, type, data, custom });

    event.id = id;
    event.metadata = metadata;

    if (initiator && initiator.id) {
      event.addInitiator(initiator);
    }

    value.validate(event, { valueName: 'event' });

    return event;
  }

  static isWellformed (event) {
    if (!event) {
      return false;
    }

    return value.isValid(event);
  }
}

module.exports = Event;
