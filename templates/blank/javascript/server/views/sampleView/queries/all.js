'use strict';

const { Readable } = require('stream');

const all = {
  getResultItemSchema () {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' }
      },
      required: [ 'id', 'createdAt', 'updatedAt' ],
      additionalProperties: false
    };
  },

  async handle (_options, { infrastructure }) {
    if (Array.isArray(infrastructure.ask.viewStore.aggregates)) {
      return Readable.from(infrastructure.ask.viewStore.aggregates);
    }

    return infrastructure.ask.viewStore.aggregates.find({}, {
      projection: { id: 1, createdAd: 1, updatedAt: 1 }
    }).stream();
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { all };
