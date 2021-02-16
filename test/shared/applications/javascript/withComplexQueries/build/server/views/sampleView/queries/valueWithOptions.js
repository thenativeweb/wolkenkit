'use strict';

const valueWithOptions = {
  type: 'value',

  getOptionsSchema () {
    return {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          properties: {
            domainEventName: { type: 'string', minLength: 1 }
          },
          required: [ 'domainEventName' ],
          additionalProperties: false
        }
      },
      required: [ 'filter' ],
      additionalProperties: false
    };
  },

  getResultItemSchema () {
    return {
      type: 'object',
      properties: {
        aggregateIdentifier: {
          type: 'object',
          properties: {
            context: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 1 }
              },
              required: [ 'name' ],
              additionalProperties: false
            },
            aggregate: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 1 },
                id: { type: 'string' }
              },
              required: [ 'name', 'id' ],
              additionalProperties: false
            }
          },
          required: [ 'context', 'aggregate' ],
          additionalProperties: false
        },
        name: { type: 'string', minLength: 1 },
        id: { type: 'string' }
      },
      required: [ 'aggregateIdentifier', 'name', 'id' ],
      additionalProperties: false
    };
  },

  async handle (options, { infrastructure }) {
    return infrastructure.ask.viewStore.domainEvents.find(
      domainEvent => domainEvent.name === options.filter.domainEventName
    );
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { valueWithOptions };
