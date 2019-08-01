import _ from 'lodash';
import uuid from 'uuidv4';
import Value from 'validate-value';

const { cloneDeep } = _;

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
  required: [ 'context', 'aggregate', 'name', 'id', 'data', 'metadata' ],
  additionalProperties: false
});

class EventExternal {
  public context: { name: string };

  public aggregate: { name: string; id: string };

  public name: string;

  public id: string;

  public data: {};

  public metadata: {
    timestamp: number;
    isPublished: boolean;
    causationId: string;
    correlationId: string;
    revision: { aggregate: number; global: number | null };
    initiator: { user: { id: string; claims: { sub: string }}};
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
    metadata: {
      timestamp: number;
      isPublished: boolean;
      causationId: string;
      correlationId: string;
      revision: { aggregate: number; global: number | null };
      initiator: { user: { id: string; claims: { sub: string }}};
    };
  }) {
    this.context = { name: context.name };
    this.aggregate = { name: aggregate.name, id: aggregate.id };
    this.name = name;
    this.id = id;

    this.data = data;
    this.metadata = metadata;

    value.validate(this, { valueName: 'event' });
  }

  protected clone (): EventExternal {
    const clonedEvent = EventExternal.fromObject(cloneDeep(this));

    return clonedEvent;
  }

  public setData ({ data }: {
    data: {};
  }): EventExternal {
    if (!data) {
      throw new Error('Data is missing.');
    }

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

  public static create ({
    context,
    aggregate,
    name,
    data = {},
    metadata
  }: {
    context: { name: string };
    aggregate: { name: string; id: string };
    name: string;
    data: {};
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
      context,
      aggregate,
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
    metadata: {
      timestamp: number;
      isPublished: boolean;
      causationId: string;
      correlationId: string;
      revision: { aggregate: number; global: number | null };
      initiator: { user: { id: string; claims: { sub: string }}};
    };
  }): EventExternal {
    const event = new EventExternal({
      context,
      aggregate,
      name,
      id,
      data,
      metadata
    });

    return event;
  }
}

export default EventExternal;
