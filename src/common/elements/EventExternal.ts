import { cloneDeep } from 'lodash';
import { IAggregateIdentifier } from './types/IAggregateIdentifier';
import { IContextIdentifier } from './types/IContextIdentifier';
import { IDictionary } from '../../types/IDictionary';
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
    }
  },
  required: [ 'contextIdentifier', 'aggregateIdentifier', 'name', 'id', 'data', 'metadata' ],
  additionalProperties: false
});

class EventExternal {
  public readonly contextIdentifier: IContextIdentifier;

  public readonly aggregateIdentifier: IAggregateIdentifier;

  public readonly name: string;

  public readonly id: string;

  public data: IDictionary<any>;

  public metadata: {
    timestamp: number;
    isPublished: boolean;
    causationId: string;
    correlationId: string;
    revision: { aggregate: number; global: number | null };
    initiator: { user: { id: string; claims: { sub: string }}};
  };

  protected constructor ({
    contextIdentifier,
    aggregateIdentifier,
    name,
    id,
    data,
    metadata
  }: {
    contextIdentifier: IContextIdentifier;
    aggregateIdentifier: IAggregateIdentifier;
    name: string;
    id: string;
    data: IDictionary<any>;
    metadata: {
      timestamp: number;
      isPublished: boolean;
      causationId: string;
      correlationId: string;
      revision: { aggregate: number; global: number | null };
      initiator: { user: { id: string; claims: { sub: string }}};
    };
  }) {
    this.contextIdentifier = contextIdentifier;
    this.aggregateIdentifier = aggregateIdentifier;
    this.name = name;
    this.id = id;

    this.data = data;
    this.metadata = metadata;

    value.validate(this, { valueName: 'event' });
  }

  public static create ({
    contextIdentifier,
    aggregateIdentifier,
    name,
    data = {},
    metadata
  }: {
    contextIdentifier: IContextIdentifier;
    aggregateIdentifier: IAggregateIdentifier;
    name: string;
    data: IDictionary<any>;
    metadata: {
      causationId?: string;
      correlationId?: string;
      revision: { aggregate: number };
      initiator: { user: { id: string; claims: { sub: string }}};
    };
  }): EventExternal {
    if (
      (metadata.causationId && !metadata.correlationId) ||
      (!metadata.causationId && metadata.correlationId)
    ) {
      throw new Error('Causation id and correlation id must either be given both or none.');
    }

    const id = uuid();

    const event = new EventExternal({
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
      }
    });

    return event;
  }

  public static deserialize (object: any): EventExternal {
    const event = new EventExternal(object);

    return event;
  }

  protected clone (): EventExternal {
    const clonedEvent = EventExternal.deserialize(cloneDeep(this));

    return clonedEvent;
  }

  public setData ({ data }: {
    data: IDictionary<any>;
  }): EventExternal {
    const updatedEvent = this.clone();

    updatedEvent.data = data;
    value.validate(updatedEvent, { valueName: 'event' });

    return updatedEvent;
  }

  public setRevisionGlobal ({ revisionGlobal }: {
    revisionGlobal: number;
  }): EventExternal {
    const updatedEvent = this.clone();

    updatedEvent.metadata.revision.global = revisionGlobal;
    value.validate(updatedEvent, { valueName: 'event' });

    return updatedEvent;
  }

  public markAsPublished (): EventExternal {
    const publishedEvent = this.clone();

    publishedEvent.metadata.isPublished = true;
    value.validate(publishedEvent, { valueName: 'event' });

    return publishedEvent;
  }
}

export default EventExternal;
