import { CommandHandler } from '../../../../../../../lib/common/elements/CommandHandler';
import { Opened } from '../domainEvents/Opened';
import { Schema } from '../../../../../../../lib/common/elements/Schema';
import { State } from '../../../../../../../lib/common/elements/State';

export interface Open {
  level?: number;
}

export const handler: CommandHandler<State, Open> = {
  getDocumentation (): string {
    return `
      # Open a game

      Opens a new instance of the never completed game.

      ## Events

      This command results in an \`Opened\` event.

      ## Examples

      Valid examples of this command look like ...
    `;
  },

  getSchema (): Schema {
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

  isAuthorized (): boolean {
    return true;
  },

  handle (state, command, { aggregate, logger }): void {
    if (aggregate.exists()) {
      throw new Error('Game was already opened.');
    }

    const level = command.data.level || 1,
          riddle = 'First letter of the alphabet?';

    logger.info('Game opened.');

    aggregate.publishDomainEvent<Opened>('Opened', { level, riddle });
  }
};
