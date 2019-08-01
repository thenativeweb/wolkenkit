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
    }
  },
  required: [ 'context', 'aggregate', 'name', 'id', 'data', 'metadata' ],
  additionalProperties: false
});

class CommandExternal {
  public context: { name: string };

  public aggregate: { name: string; id: string }

  public name: string;

  public id: string;

  public data: {};

  public metadata: {
    timestamp: number;
    causationId: string;
    correlationId: string;
  };

  protected constructor ({
    context,
    aggregate,
    name,
    id,
    data,
    metadata
  }: {
    context: { name: string };
    aggregate: { name: string; id: string };
    name: string;
    id: string;
    data: {};
    metadata: { timestamp: number; causationId: string; correlationId: string };
  }) {
    this.context = { name: context.name };
    this.aggregate = { name: aggregate.name, id: aggregate.id };
    this.name = name;
    this.id = id;

    this.data = data;
    this.metadata = metadata;

    value.validate(this, { valueName: 'command' });
  }

  public static create ({
    context,
    aggregate,
    name,
    data = {},
    metadata = {}
  }: {
    context: { name: string };
    aggregate: { name: string; id: string };
    name: string;
    data: {};
    metadata: { causationId?: string; correlationId?: string };
  }): CommandExternal {
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

  public static fromObject ({
    context,
    aggregate,
    name,
    id,
    data,
    metadata
  }: {
    context: { name: string };
    aggregate: { name: string; id: string };
    name: string;
    id: string;
    data: {};
    metadata: { timestamp: number; causationId: string; correlationId: string };
  }): CommandExternal {
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

  public static validate ({ command, application }: {
    command: any;
    application: any;
  }): void {
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

export default CommandExternal;
