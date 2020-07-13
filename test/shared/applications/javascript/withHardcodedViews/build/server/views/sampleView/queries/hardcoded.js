'use strict';

const { Readable } = require('stream');

const hardcoded = {
  type: 'stream',

  getResultItemSchema () {
    return {
      type: 'object',
      properties: {
        value: { type: 'string', minLength: 1 }
      },
      required: [ 'value' ],
      additionalProperties: false
    };
  },

  async handle () {
    return Readable.from([
      { value: 'foo' },
      { value: 'bar' },
      { value: 'baz' }
    ]);
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { hardcoded };
