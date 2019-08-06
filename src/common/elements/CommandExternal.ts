import { AggregateIdentifier } from './AggregateIdentifier';
import { ContextIdentifier } from './ContextIdentifier';
import { Dictionary } from '../../types/Dictionary';
import uuid from 'uuidv4';
import Value from 'validate-value';
import errors from '../errors';

const uuidRegex = uuid.regex.v4.toString().slice(1, -1);

const value = new Value({
  type: 'object',
  properties: {
    contextIdentifier: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, format: 'alphanumeric' }
      },
      required: [ 'name' ],
      additionalProperties: false
    },
    aggregateIdentifier: {
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
  required: [ 'contextIdentifier', 'aggregateIdentifier', 'name', 'id', 'data', 'metadata' ],
  additionalProperties: false
});

class CommandExternal {
  public readonly contextIdentifier: ContextIdentifier;

  public readonly aggregateIdentifier: AggregateIdentifier;

  public readonly name: string;

  public readonly id: string;

  public data: Dictionary<any>;

  public metadata: {
    timestamp: number;
    causationId: string;
    correlationId: string;
  };

  protected constructor ({
    contextIdentifier,
    aggregateIdentifier,
    name,
    id,
    data,
    metadata
  }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    id: string;
    data: Dictionary<any>;
    metadata: { timestamp: number; causationId: string; correlationId: string };
  }) {
    this.contextIdentifier = contextIdentifier;
    this.aggregateIdentifier = aggregateIdentifier;
    this.name = name;
    this.id = id;

    this.data = data;
    this.metadata = metadata;

    value.validate(this, { valueName: 'command' });
  }

  public static create ({
    contextIdentifier,
    aggregateIdentifier,
    name,
    data = {},
    metadata = {}
  }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data?: Dictionary<any>;
    metadata?: { causationId?: string; correlationId?: string };
  }): CommandExternal {
    if (
      (metadata.causationId && !metadata.correlationId) ||
      (!metadata.causationId && metadata.correlationId)
    ) {
      throw new Error('Causation id and correlation id must either be given both or none.');
    }

    const id = uuid();

    const command = new CommandExternal({
      contextIdentifier,
      aggregateIdentifier,
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

  public static deserialize (object: any): CommandExternal {
    const command = new CommandExternal(object);

    return command;
  }

  public static validate ({ command, application }: {
    command: any;
    application: any;
  }): void {
    let deserializedCommand;

    try {
      deserializedCommand = CommandExternal.deserialize(command);
    } catch {
      throw new errors.CommandMalformed();
    }

    const context = application.commands.internal[deserializedCommand.contextIdentifier.name];

    if (!context) {
      throw new Error('Invalid context name.');
    }

    const aggregate = context[deserializedCommand.aggregateIdentifier.name];

    if (!aggregate) {
      throw new Error('Invalid aggregate name.');
    }

    if (!aggregate[deserializedCommand.name]) {
      throw new Error('Invalid command name.');
    }

    const { schema } = aggregate[deserializedCommand.name];

    if (!schema) {
      return;
    }

    const dataValue = new Value(schema);

    dataValue.validate(deserializedCommand.data, { valueName: 'command.data' });
  }
}

export default CommandExternal;
