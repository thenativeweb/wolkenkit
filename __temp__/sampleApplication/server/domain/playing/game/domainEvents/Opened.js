'use strict';

const handler = {
  getDocumentation () {
    return `
      # A game was opened

      A new instance of the never completed game was opened.

      ## Examples

      Valid examples of this event look like ...
    `;
  },

  getSchema () {
    return {
      type: 'object',
      properties: {
        level: {
          title: 'The level.',
          description: 'The level the game was opened with.',
          type: 'number'
        },
        riddle: {
          title: 'The riddle.',
          description: 'The riddle the game was opened with.',
          type: 'string'
        }
      },
      required: [ 'level', 'riddle' ],
      additionalProperties: false
    };
  },

  handle (state, domainEvent) {
    return {
      level: domainEvent.data.level
    };
  },

  isAuthorized () {
    return true;
  },

  filter () {
    return true;
  },

  map (state, domainEvent) {
    return domainEvent;
  }
};

module.exports = { handler };
