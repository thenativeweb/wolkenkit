import { Opened } from '../events/Opened';
import { State } from '../State';
import { Aggregate, Command, CommandHandler, Services } from '../../../../../elements';

export class Open {
  public constructor (
    public level?: number
  ) {}
}

export class OpenHandler extends CommandHandler<State, Open> {
  /* eslint-disable class-methods-use-this */
  public isAuthorized (): boolean {
    return true;
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public handle (game: Aggregate<State>, command: Command<Open>, services: Services): void {
    if (game.exists()) {
      throw new Error('Game was already opened.');
    }

    const level = command.data.level || 1,
          riddle = 'First letter of the alphabet?';

    services.logger.info('Game opened.');

    game.publishEvent(new Opened(level, riddle));
  }
  /* eslint-enable class-methods-use-this */
}
