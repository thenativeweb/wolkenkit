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
        contextIdentifier: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 }
          },
          required: [ 'name' ],
          additionalProperties: false
        },
        aggregateIdentifier: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            id: { type: 'string' }
          },
          required: [ 'name', 'id' ],
          additionalProperties: false
        },
        name: { type: 'string', minLength: 1 },
        id: { type: 'string' }
      },
      required: [ 'contextIdentifier', 'aggregateIdentifier', 'name', 'id' ],
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
