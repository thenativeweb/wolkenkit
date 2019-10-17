import { State } from '../State';
import { Aggregate, Event, EventHandler } from '../../../../../elements';

export class Opened {
  public static identifier = 'playing.game.Opened';

  public constructor (
    public level: number,
    public riddle: string
  ) {}
}

export class OpenedHandler extends EventHandler<State, Opened> {
  /* eslint-disable class-methods-use-this */
  public handle (game: Aggregate<State>, event: Event<Opened>): Partial<State> {
    return {
      level: event.data.level
    };
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public isAuthorized (): boolean {
    return true;
  }
  /* eslint-enable class-methods-use-this */
}
