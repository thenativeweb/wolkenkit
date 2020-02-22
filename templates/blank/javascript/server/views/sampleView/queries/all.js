'use strict';

const { PassThrough } = require('stream');

const all = {
  getResultItemSchema () {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' }
      },
      required: [ 'id', 'createdAt' ],
      additionalProperties: false
    };
  },

  async handle (sampleItems) {
    const stream = new PassThrough({ objectMode: true });

    for (const sampleItem of sampleItems) {
      stream.write(sampleItem);
    }
    stream.end();

    return stream;
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { all };
