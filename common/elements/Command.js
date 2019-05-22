'use strict';

const cloneDeep = require('lodash/cloneDeep'),
      uuid = require('uuidv4'),
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
        causationId: { type: 'string', pattern: uuidRegex },
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
        }
      },
      required: [],
      additionalProperties: false
    }
  },
  required: [ 'context', 'aggregate', 'name', 'id', 'data', 'metadata', 'annotations' ],
  additionalProperties: false
});

class Command {
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

    this.context = { name: context.name };
    this.aggregate = { name: aggregate.name, id: aggregate.id };
    this.name = name;
    this.id = id;

    this.data = data;
    this.metadata = metadata;
    this.annotations = annotations;

    value.validate(this, { valueName: 'command' });
  }

  clone () {
    const clonedCommand = Command.fromObject(cloneDeep(this));

    return clonedCommand;
  }

  withoutAnnotations () {
    const commandWithoutAnnotations = this.clone();

    commandWithoutAnnotations.annotations = {};
    value.validate(commandWithoutAnnotations, { valueName: 'command' });

    return commandWithoutAnnotations;
  }

  static create ({
    context,
    aggregate,
    name,
    data = {},
    metadata = {},
    annotations = {}
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

    const command = new Command({
      context,
      aggregate,
      name,
      id,
      data,
      metadata: {
        ...metadata,
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

    const command = new Command({
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
}

module.exports = Command;
