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
  required: [ 'context', 'aggregate', 'name', 'id', 'data', 'metadata' ],
  additionalProperties: false
});

class CommandExternal {
  constructor ({
    context,
    aggregate,
    name,
    id,
    data,
    metadata
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

    this.context = { name: context.name };
    this.aggregate = { name: aggregate.name, id: aggregate.id };
    this.name = name;
    this.id = id;

    this.data = data;
    this.metadata = metadata;

    value.validate(this, { valueName: 'command' });
  }

  static create ({
    context,
    aggregate,
    name,
    data = {},
    metadata = {}
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

    if (
      (metadata.causationId && !metadata.correlationId) ||
      (!metadata.causationId && metadata.correlationId)
    ) {
      throw new Error('Causation id and correlation id must either be given both or none.');
    }

    const id = uuid();

    const command = new CommandExternal({
      context,
      aggregate,
      name,
      id,
      data,
      metadata: {
        causationId: metadata.causationId || id,
        correlationId: metadata.correlationId || id,
        timestamp: Date.now()
      }
    });

    return command;
  }

  static fromObject ({
    context,
    aggregate,
    name,
    id,
    data,
    metadata
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

    const command = new CommandExternal({
      context,
      aggregate,
      name,
      id,
      data,
      metadata
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
      CommandExternal.fromObject(command);
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

module.exports = CommandExternal;
