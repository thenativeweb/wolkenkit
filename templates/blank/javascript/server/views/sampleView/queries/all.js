'use strict';

const { Readable } = require('stream');

const all = {
  type: 'stream',

  getResultItemSchema () {
    return {
      type: 'object',
      properties: {
        id: { type: 'number' },
        task: { type: 'string' }
      },
      required: [],
      additionalProperties: false
    };
  },

  async handle () {
    return Readable.from([
      { id: 1, task: 'task 1' },
      { id: 2, task: 'task 2' }
    ]);
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { all };
