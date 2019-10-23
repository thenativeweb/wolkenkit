'use strict';

const handler = {
  getDocumentation () {
    return `
      # Open a game

      Opens a new instance of the never completed game.

      ## Events

      This command results in an \`Opened\` event.

      ## Examples

      Valid examples of this command look like ...
    `;
  },

  getSchema () {
    return {
      type: 'object',
      properties: {
        level: {
          title: 'The level.',
          description: 'The level to open the game with.',
          type: 'number'
        }
      },
      required: [],
      additionalProperties: false
    };
  },

  isAuthorized () {
    return true;
  },

  handle (state, command, { aggregate, logger }) {
    if (aggregate.exists()) {
      rejectCommand('Game was already opened.');
    }

    const level = command.data.level || 1,
          riddle = 'First letter of the alphabet?';

    logger.info('Game opened.');

    aggregate.publishEvent('Opened', { level, riddle });
  }
};

module.exports = { handler };
