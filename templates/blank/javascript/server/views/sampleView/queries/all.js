'use strict';

const { Readable } = require('stream');

const all = {
  type: 'stream',

  getResultItemSchema () {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: [],
      additionalProperties: false
    };
  },

  async handle () {
    return Readable.from([]);
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { all };
