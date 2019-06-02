'use strict';

const cloneDeep = require('lodash/cloneDeep'),
      uuid = require('uuidv4'),
      Value = require('validate-value');

const EventExternal = require('./EventExternal');

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
  required: [ 'context', 'aggregate', 'name', 'id', 'data', 'metadata', 'annotations' ],
  additionalProperties: false
});

class EventInternal extends EventExternal {
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
      throw new Error('Timestamp is missing.');
    }
    if (metadata.isPublished === undefined) {
      throw new Error('Is published is missing.');
    }
    if (!metadata.causationId) {
      throw new Error('Causation id is missing.');
    }
    if (!metadata.correlationId) {
      throw new Error('Correlation id is missing.');
    }
    if (!metadata.revision) {
      throw new Error('Revision is missing.');
    }
    if (!metadata.revision.aggregate) {
      throw new Error('Revision aggregate is missing.');
    }
    if (metadata.revision.global === undefined) {
      throw new Error('Revision global is missing.');
    }
    if (!metadata.initiator) {
      throw new Error('Initiator is missing.');
    }
    if (!metadata.initiator.user) {
      throw new Error('Initiator user is missing.');
    }
    if (!metadata.initiator.user.id) {
      throw new Error('Initiator user id is missing.');
    }
    if (!metadata.initiator.user.claims) {
      throw new Error('Initiator user claims is missing.');
    }
    if (!metadata.initiator.user.claims.sub) {
      throw new Error('Initiator user claims sub is missing.');
    }
    if (!annotations) {
      throw new Error('Annotations is missing.');
    }

    super({ context, aggregate, name, id, data, metadata });
    this.annotations = annotations;

    value.validate(this, { valueName: 'event' });
  }

  clone () {
    const clonedEvent = EventInternal.fromObject(cloneDeep(this));

    return clonedEvent;
  }

  setData ({ data }) {
    if (!data) {
      throw new Error('Data is missing.');
    }

    const updatedEvent = this.clone();

    updatedEvent.data = data;
    value.validate(updatedEvent, { valueName: 'event' });

    return updatedEvent;
  }

  setRevisionGlobal ({ revisionGlobal }) {
    if (!revisionGlobal) {
      throw new Error('Revision global is missing.');
    }

    const updatedEvent = this.clone();

    updatedEvent.metadata.revision.global = revisionGlobal;
    value.validate(updatedEvent, { valueName: 'event' });

    return updatedEvent;
  }

  markAsPublished () {
    const publishedEvent = this.clone();

    publishedEvent.metadata.isPublished = true;
    value.validate(publishedEvent, { valueName: 'event' });

    return publishedEvent;
  }

  asExternal () {
    const clonedEvent = this.clone();
    const externalEvent = EventExternal.fromObject({
      context: clonedEvent.context,
      aggregate: clonedEvent.aggregate,
      name: clonedEvent.name,
      id: clonedEvent.id,
      data: clonedEvent.data,
      metadata: clonedEvent.metadata
    });

    return externalEvent;
  }

  static create ({
    context,
    aggregate,
    name,
    data = {},
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
    if (!metadata) {
      throw new Error('Metadata is missing.');
    }
    if (
      (metadata.causationId && !metadata.correlationId) ||
      (!metadata.causationId && metadata.correlationId)
    ) {
      throw new Error('Causation id and correlation id must either be given both or none.');
    }
    if (!metadata.revision) {
      throw new Error('Metadata revision is missing.');
    }
    if (!metadata.revision.aggregate) {
      throw new Error('Metadata revision aggregate is missing.');
    }
    if (!metadata.initiator) {
      throw new Error('Metadata initiator is missing.');
    }
    if (!metadata.initiator.user) {
      throw new Error('Metadata initiator user is missing.');
    }
    if (!metadata.initiator.user.id) {
      throw new Error('Metadata initiator user id is missing.');
    }
    if (!metadata.initiator.user.claims) {
      throw new Error('Metadata initiator user claims is missing.');
    }
    if (!metadata.initiator.user.claims.sub) {
      throw new Error('Metadata initiator user claims sub is missing.');
    }
    if (!annotations) {
      throw new Error('Annotations is missing.');
    }
    if (!annotations.state) {
      throw new Error('Annotations state is missing.');
    }
    if (!annotations.previousState) {
      throw new Error('Annotations previous state is missing.');
    }

    const id = uuid();

    const event = new EventInternal({
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
      },
      annotations
    });

    return event;
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
    if (!metadata.revision) {
      throw new Error('Metadata revision is missing.');
    }
    if (!metadata.revision.aggregate) {
      throw new Error('Metadata revision aggregate is missing.');
    }
    if (metadata.revision.global === undefined) {
      throw new Error('Metadata revision global is missing.');
    }
    if (!metadata.initiator) {
      throw new Error('Metadata initiator is missing.');
    }
    if (!metadata.initiator.user) {
      throw new Error('Metadata initiator user is missing.');
    }
    if (!metadata.initiator.user.id) {
      throw new Error('Metadata initiator user id is missing.');
    }
    if (!metadata.initiator.user.claims) {
      throw new Error('Metadata initiator user claims is missing.');
    }
    if (!metadata.initiator.user.claims.sub) {
      throw new Error('Metadata initiator user claims sub is missing.');
    }
    if (!annotations) {
      throw new Error('Annotations is missing.');
    }
    if (!annotations.state) {
      throw new Error('Annotations state is missing.');
    }
    if (!annotations.previousState) {
      throw new Error('Annotations previous state is missing.');
    }

    const event = new EventInternal({
      context,
      aggregate,
      name,
      id,
      data,
      metadata,
      annotations
    });

    return event;
  }

  static validate ({ event, application }) {
    if (!event) {
      throw new Error('Event is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }

    try {
      EventInternal.fromObject(event);
    } catch {
      throw new Error('Malformed event.');
    }

    const context = application.events.internal[event.context.name];

    if (!context) {
      throw new Error('Invalid context name.');
    }

    const aggregate = context[event.aggregate.name];

    if (!aggregate) {
      throw new Error('Invalid aggregate name.');
    }

    if (!aggregate[event.name]) {
      throw new Error('Invalid event name.');
    }

    const { schema } = aggregate[event.name];

    if (!schema) {
      return;
    }

    const valueData = new Value(schema);

    valueData.validate(event.data, { valueName: 'event.data' });
  }
}

module.exports = EventInternal;
