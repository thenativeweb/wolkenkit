'use strict';

const all = {
  getResultItemSchema () {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        text: { type: 'string' },
        likes: { type: 'number' },
        timestamp: { type: 'number' }
      },
      required: [ 'id', 'text', 'likes', 'timestamp' ],
      additionalProperties: false
    };
  },

  async handle (messageItems) {
    const stream = new PassThrough({ objectMode: true });

    for (const messageItem of messageItems) {
      stream.write(messageItem);
    }
    stream.end();

    return stream;
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { all };
