'use strict';

const first = {
  type: 'value',

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
    return infrastructure.ask.viewStore.domainEvents[0];
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { first };
