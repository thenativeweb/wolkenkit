'use strict';

const handler = {
  getDocumentation () {
    return `
      # The top 50 games

      A list of the top 50 games.
    `;
  },

  getOptionsSchema () {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    };
  },

  getItemSchema () {
    return {
      type: 'object',
      properties: {
        level: {
          title: 'The current level',
          description: 'The current level of the game.',
          type: 'number'
        },
        riddle: {
          title: 'The current riddle',
          description: 'The current riddle of the game.',
          type: 'string'
        }
      },
      required: [ 'level', 'riddle' ],
      additionalProperties: false
    };
  },

  async handle (games) {
    return games.
      find({}, { sort: { level: -1 }, limit: 50 }).
      map(item => ({ level: item.level, riddle: item.riddle })).
      stream();
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { handler };
