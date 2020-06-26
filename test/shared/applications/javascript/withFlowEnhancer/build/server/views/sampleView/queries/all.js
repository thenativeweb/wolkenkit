'use strict';

const { PassThrough } = require('stream');

const all = {
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

  async handle (sampleItems) {
    const stream = new PassThrough({ objectMode: true });

    for (const item of sampleItems) {
      stream.write(item);
    }
    stream.end();

    return stream;
  },

  isAuthorized () {
    return true;
  }
};

module.exports = {
  all
};
