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
            id: { type: 'string', minLength: 1 },
            token: {
              type: 'object',
              properties: {
                sub: { type: 'string', minLength: 1 }
              },
              required: [ 'sub' ],
              additionalProperties: true
            }
          },
          required: [ 'id', 'token' ],
          additionalProperties: false
        }
      ]
    },
    metadata: {
      type: 'object',
      properties: {
        timestamp: { type: 'number' },
        correlationId: { type: 'string', pattern: uuidRegex },
        causationId: { type: 'string', pattern: uuidRegex }
      },
      required: [ 'timestamp', 'correlationId', 'causationId' ],
      additionalProperties: false
    }
  },
  required: [ 'context', 'aggregate', 'name', 'id', 'data', 'custom', 'metadata' ],
  additionalProperties: false
});

class Command {
  constructor ({ context, aggregate, name, data = {}, custom = {}}) {
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
      throw new Error('Name is missing.');
    }

    this.context = { name: context.name };
    this.aggregate = { name: aggregate.name, id: aggregate.id };
    this.name = name;
    this.id = uuid();

    this.data = data;
    this.custom = custom;
    this.initiator = null;
    this.metadata = {
      timestamp: Date.now(),
      correlationId: this.id,
      causationId: this.id
    };

    value.validate(this, { valueName: 'command' });
  }

  addInitiator ({ token }) {
    if (!token) {
      throw new Error('Token is missing.');
    }
    if (!token.sub) {
      throw new Error('Sub claim is missing.');
    }

    this.initiator = {
      id: token.sub,
      token
    };
  }

  static deserialize ({
    context,
    aggregate,
    name,
    id,
    metadata,
    initiator,
    data = {},
    custom = {}
  }) {
    const command = new Command({ context, aggregate, name, data, custom });

    command.id = id;
    command.metadata.timestamp = metadata.timestamp;
    command.metadata.correlationId = metadata.correlationId;
    command.metadata.causationId = metadata.causationId;

    if (initiator && initiator.token) {
      command.addInitiator({ token: initiator.token });
    }

    value.validate(command, { valueName: 'command' });

    return command;
  }

  static isWellformed (command) {
    if (!command) {
      return false;
    }

    return value.isValid(command);
  }
}

module.exports = Command;
