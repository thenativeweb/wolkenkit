'use strict';

const uuid = require('uuidv4'),
      Value = require('validate-value');

const CommandExternal = require('./CommandExternal');

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
    metadata: {
      type: 'object',
      properties: {
        timestamp: { type: 'number' },
        correlationId: { type: 'string', pattern: uuidRegex },
        causationId: { type: 'string', pattern: uuidRegex }
      },
      required: [ 'timestamp', 'correlationId', 'causationId' ],
      additionalProperties: false
    },
    annotations: {
      type: 'object',
      properties: {
        client: {
          type: 'object',
          properties: {
            token: { type: 'string', minLength: 1 },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', minLength: 1 },
                claims: {
                  type: 'object',
                  properties: {
                    sub: { type: 'string', minLength: 1 }
                  },
                  required: [ 'sub' ],
                  additionalProperties: true
                }
              },
              required: [ 'id', 'claims' ],
              additionalProperties: false
            },
            ip: { type: 'string', minLength: 1 }
          },
          required: [ 'token', 'user', 'ip' ],
          additionalProperties: false
        },
        initiator: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', minLength: 1 },
                claims: {
                  type: 'object',
                  properties: {
                    sub: { type: 'string', minLength: 1 }
                  },
                  required: [ 'sub' ],
                  additionalProperties: true
                }
              },
              required: [ 'id', 'claims' ],
              additionalProperties: false
            }
          },
          required: [ 'user' ],
          additionalProperties: false
        }
      },
      required: [ 'client', 'initiator' ],
      additionalProperties: false
    }
  },
  required: [ 'context', 'aggregate', 'name', 'id', 'data', 'metadata', 'annotations' ],
  additionalProperties: false
});

class CommandInternal extends CommandExternal {
  constructor ({
    context,
    aggregate,
    name,
    id,
    data,
    metadata,
    annotations
  }) {
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
    if (!id) {
      throw new Error('Id is missing.');
    }
    if (!data) {
      throw new Error('Data is missing.');
    }
    if (!metadata) {
      throw new Error('Metadata is missing.');
    }
    if (!metadata.timestamp) {
      throw new Error('Metadata timestamp is missing.');
    }
    if (!metadata.causationId) {
      throw new Error('Metadata causation id is missing.');
    }
    if (!metadata.correlationId) {
      throw new Error('Metadata correlation id is missing.');
    }
    if (!annotations) {
      throw new Error('Annotations is missing.');
    }
    if (!annotations.client) {
      throw new Error('Annotations client is missing.');
    }
    if (!annotations.initiator) {
      throw new Error('Annotations initiator is missing.');
    }

    super({ context, aggregate, name, id, data, metadata });
    this.annotations = annotations;

    value.validate(this, { valueName: 'command' });
  }

  static create ({
    context,
    aggregate,
    name,
    data = {},
    metadata = {},
    annotations
  }) {
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
    if (!annotations) {
      throw new Error('Annotations is missing.');
    }
    if (!annotations.client) {
      throw new Error('Annotations client is missing.');
    }
    if (!annotations.initiator) {
      throw new Error('Annotations initiator is missing.');
    }

    if (
      (metadata.causationId && !metadata.correlationId) ||
      (!metadata.causationId && metadata.correlationId)
    ) {
      throw new Error('Causation id and correlation id must either be given both or none.');
    }

    const id = uuid();

    const command = new CommandInternal({
      context,
      aggregate,
      name,
      id,
      data,
      metadata: {
        causationId: metadata.causationId || id,
        correlationId: metadata.correlationId || id,
        timestamp: Date.now()
      },
      annotations
    });

    return command;
  }

  static fromObject ({
    context,
    aggregate,
    name,
    id,
    data,
    metadata,
    annotations
  }) {
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
    if (!id) {
      throw new Error('Id is missing.');
    }
    if (!data) {
      throw new Error('Data is missing.');
    }
    if (!metadata) {
      throw new Error('Metadata is missing.');
    }
    if (!metadata.timestamp) {
      throw new Error('Metadata timestamp is missing.');
    }
    if (!metadata.causationId) {
      throw new Error('Metadata causation id is missing.');
    }
    if (!metadata.correlationId) {
      throw new Error('Metadata correlation id is missing.');
    }
    if (!annotations) {
      throw new Error('Annotations is missing.');
    }
    if (!annotations.client) {
      throw new Error('Annotations client is missing.');
    }
    if (!annotations.initiator) {
      throw new Error('Annotations initiator is missing.');
    }

    const command = new CommandInternal({
      context,
      aggregate,
      name,
      id,
      data,
      metadata,
      annotations
    });

    return command;
  }

  static validate ({ command, application }) {
    if (!command) {
      throw new Error('Command is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }

    try {
      CommandInternal.fromObject(command);
    } catch {
      throw new Error('Malformed command.');
    }

    const context = application.commands.internal[command.context.name];

    if (!context) {
      throw new Error('Invalid context name.');
    }

    const aggregate = context[command.aggregate.name];

    if (!aggregate) {
      throw new Error('Invalid aggregate name.');
    }

    if (!aggregate[command.name]) {
      throw new Error('Invalid command name.');
    }

    const { schema } = aggregate[command.name];

    if (!schema) {
      return;
    }

    const dataValue = new Value(schema);

    dataValue.validate(command.data, { valueName: 'command.data' });
  }
}

module.exports = CommandInternal;
