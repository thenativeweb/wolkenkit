import { AggregateIdentifier } from './AggregateIdentifier';
import Application from '../application';
import { cloneDeep } from 'lodash';
import { ContextIdentifier } from './ContextIdentifier';
import { Dictionary } from '../../types/Dictionary';
import errors from '../errors';
import EventExternal from './EventExternal';
import { State } from './State';
import uuid from 'uuidv4';
import Value from 'validate-value';

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
        isPublished: { type: 'boolean' },
        causationId: { type: 'string', pattern: uuidRegex },
        correlationId: { type: 'string', pattern: uuidRegex },
        revision: {
          type: 'object',
          properties: {
            aggregate: { type: 'number', minimum: 1 },
            global: {
              anyOf: [{ type: 'number', minimum: 1 }, { type: 'null' }]
            }
          },
          required: [ 'aggregate' ],
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
      required: [
        'timestamp',
        'isPublished',
        'causationId',
        'correlationId',
        'revision',
        'initiator'
      ],
      additionalProperties: false
    },
    annotations: {
      type: 'object',
      properties: {
        state: {
          type: 'object',
          properties: {},
          required: [],
          additionalProperties: true
        },
        previousState: {
          type: 'object',
          properties: {},
          required: [],
          additionalProperties: true
        }
      },
      required: [ 'state', 'previousState' ],
      additionalProperties: false
    }
  },
  required: [ 'contextIdentifier', 'aggregateIdentifier', 'name', 'id', 'data', 'metadata', 'annotations' ],
  additionalProperties: false
});

class EventInternal extends EventExternal {
  public annotations: { state: State; previousState: State };

  protected constructor ({
    contextIdentifier,
    aggregateIdentifier,
    name,
    id,
    data,
    metadata,
    annotations
  }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    id: string;
    data: Dictionary<any>;
    metadata: {
      timestamp: number;
      isPublished: boolean;
      causationId: string;
      correlationId: string;
      revision: { aggregate: number; global: number | null };
      initiator: { user: { id: string; claims: { sub: string }}};
    };
    annotations: { state: State; previousState: State };
  }) {
    super({ contextIdentifier, aggregateIdentifier, name, id, data, metadata });
    this.annotations = annotations;

    value.validate(this, { valueName: 'event' });
  }

  public static create ({
    contextIdentifier,
    aggregateIdentifier,
    name,
    data = {},
    metadata,
    annotations
  }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data?: Dictionary<any>;
    metadata: {
      causationId?: string;
      correlationId?: string;
      revision: { aggregate: number };
      initiator: { user: { id: string; claims: { sub: string }}};
    };
    annotations: {
      state: State;
      previousState: State;
    };
  }): EventInternal {
    if (
      (metadata.causationId && !metadata.correlationId) ||
      (!metadata.causationId && metadata.correlationId)
    ) {
      throw new Error('Causation id and correlation id must either be given both or none.');
    }

    const id = uuid();

    const event = new EventInternal({
      contextIdentifier,
      aggregateIdentifier,
      name,
      id,
      data,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        isPublished: false,
        causationId: metadata.causationId || id,
        correlationId: metadata.correlationId || id,
        revision: {
          aggregate: metadata.revision.aggregate,
          global: null
        }
      },
      annotations
    });

    return event;
  }

  public static deserialize (object: any): EventInternal {
    const event = new EventInternal(object);

    return event;
  }

  public static validate ({ event, application }: {
    event: any;
    application: Application;
  }): void {
    let deserializedEvent;

    try {
      deserializedEvent = EventInternal.deserialize(event);
    } catch {
      throw new errors.EventMalformed();
    }

    const context = application.events.internal[deserializedEvent.contextIdentifier.name];

    if (!context) {
      throw new Error('Invalid context name.');
    }

    const aggregate = context[deserializedEvent.aggregateIdentifier.name];

    if (!aggregate) {
      throw new Error('Invalid aggregate name.');
    }

    const aggregateEvent = aggregate[deserializedEvent.name];

    if (!aggregateEvent) {
      throw new Error('Invalid event name.');
    }

    const { schema } = aggregateEvent;

    if (!schema) {
      return;
    }

    const valueData = new Value(schema);

    valueData.validate(deserializedEvent.data, { valueName: 'event.data' });
  }

  public setData ({ data }: {
    data: Dictionary<any>;
  }): EventInternal {
    const updatedEvent = this.clone();

    updatedEvent.data = data;
    value.validate(updatedEvent, { valueName: 'event' });

    return updatedEvent;
  }

  public setRevisionGlobal ({ revisionGlobal }: {
    revisionGlobal: number;
  }): EventInternal {
    if (!revisionGlobal) {
      throw new Error('Revision global is missing.');
    }

    const updatedEvent = this.clone();

    updatedEvent.metadata.revision.global = revisionGlobal;
    value.validate(updatedEvent, { valueName: 'event' });

    return updatedEvent;
  }

  public markAsPublished (): EventInternal {
    const publishedEvent = this.clone();

    publishedEvent.metadata.isPublished = true;
    value.validate(publishedEvent, { valueName: 'event' });

    return publishedEvent;
  }

  public asExternal (): EventExternal {
    const clonedEvent = this.clone();
    const externalEvent = EventExternal.deserialize({
      contextIdentifier: clonedEvent.contextIdentifier,
      aggregateIdentifier: clonedEvent.aggregateIdentifier,
      name: clonedEvent.name,
      id: clonedEvent.id,
      data: clonedEvent.data,
      metadata: clonedEvent.metadata
    });

    return externalEvent;
  }

  protected clone (): EventInternal {
    const clonedEvent = EventInternal.deserialize(cloneDeep(this));

    return clonedEvent;
  }
}

export default EventInternal;
