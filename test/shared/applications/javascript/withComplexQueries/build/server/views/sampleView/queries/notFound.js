'use strict';

const notFound = {
  type: 'value',

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

  async handle (options, { error }) {
    throw new error.NotFound();
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { notFound };
