'use strict';

const handler = {
  getDocumentation () {
    return `
      # All games

      A list of all games.
    `;
  },

  getOptionsSchema () {
    return {
      type: 'object',
      properties: {
        orderBy: {
          title: 'Order by.',
          description: 'The order by criterion.',
          type: 'string',
          default: 'id'
        }
      },
      required: [ 'orderBy' ],
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

  async handle (games, queryOptions) {
    return games.
      find({}, { sort: { [queryOptions.orderBy || 'id']: 1 }}).
      map(item => ({ level: item.level, riddle: item.riddle })).
      stream();
  },

  isAuthorized (_game, { logger }) {
    logger.info('Access granted.');

    return true;
  }
};

module.exports = { handler };
