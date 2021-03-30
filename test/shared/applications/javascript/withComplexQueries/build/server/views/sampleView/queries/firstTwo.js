'use strict';

const firstTwo = {
  type: 'value',

  getResultItemSchema () {
    return {
      type: 'array',
      items: {
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
      }
    };
  },

  async handle (options, { infrastructure }) {
    return infrastructure.ask.viewStore.domainEvents.slice(0, 2);
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { firstTwo };
