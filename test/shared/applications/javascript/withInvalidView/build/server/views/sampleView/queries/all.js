'use strict';

const { Readable } = require('stream');

const all = {
  type: 'stream',

  getResultItemSchema () {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' },
        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
      },
      required: [ 'id', 'createdAt', 'strategy' ],
      additionalProperties: false
    };
  },

  async handle (options, { infrastructure }) {
    return Readable.from(infrastructure.ask.viewStore.domainEvents);
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { all };
