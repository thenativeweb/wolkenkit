import CommandExternal from './CommandExternal';
import uuid from 'uuidv4';
import Value from 'validate-value';

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
  public annotations: { client: number; initiator: number };

  protected constructor ({
    context,
    aggregate,
    name,
    id,
    data,
    metadata,
    annotations
  }: {
    context: { name: string };
    aggregate: { name: string; id: string };
    name: string;
    id: string;
    data: {};
    metadata: { timestamp: number; causationId: string; correlationId: string };
    annotations: { client: number; initiator: number };
  }) {
    super({ context, aggregate, name, id, data, metadata });
    this.annotations = annotations;

    value.validate(this, { valueName: 'command' });
  }

  public static create ({
    context,
    aggregate,
    name,
    data = {},
    metadata = {},
    annotations
  }: {
    context: { name: string };
    aggregate: { name: string; id: string };
    name: string;
    data: {};
    metadata: { causationId?: string; correlationId?: string };
    annotations: { client: number; initiator: number };
  }): CommandInternal {
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

  public static fromObject ({
    context,
    aggregate,
    name,
    id,
    data,
    metadata,
    annotations
  }: {
    context: { name: string };
    aggregate: { name: string; id: string };
    name: string;
    id: string;
    data: {};
    metadata: { timestamp: number; causationId: string; correlationId: string };
    annotations: { client: number; initiator: number };
  }): CommandInternal {
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

  public static validate ({ command, application }: {
    command: any;
    application: any;
  }): void {
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

export default CommandInternal;
