import { Opened } from '../events/Opened';
import { State } from '../State';
import { Command, CommandHandler, Schema, Services } from '../../../../../elements';

export interface Open {
  level?: number;
}

export class Handler extends CommandHandler<State, Open> {
  /* eslint-disable class-methods-use-this */
  public getDocumentation (): string {
    return `
      # Open a game

      Opens a new instance of the never completed game.

      ## Events

      This command results in an \`Opened\` event.

      ## Examples

      Valid examples of this command look like ...
    `;
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public getSchema (): Schema {
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
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public isAuthorized (): boolean {
    return true;
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public handle (state: State, command: Command<Open>, { aggregate, logger }: Services): void {
    if (aggregate.exists()) {
      throw new Error('Game was already opened.');
    }

    const level = command.data.level || 1,
          riddle = 'First letter of the alphabet?';

    logger.info('Game opened.');

    aggregate.publishEvent<Opened>('Opened', { level, riddle });
  }
  /* eslint-enable class-methods-use-this */
}
