import { Collection } from 'mongodb';
import { Opened } from '../../../domain/playing/game/events/Opened';
import { Event, Projection } from '../../../../elements';

export class PlayingGameOpened extends Projection<Opened> {
  public constructor (
    public eventIdentifier: string = Opened.identifier
  ) {
    super();
  }

  /* eslint-disable class-methods-use-this */
  public async handle (games: Collection, event: Event<Opened>): Promise<void> {
    await games.insertOne({
      level: event.data.level,
      riddle: event.data.riddle
    });
  }
  /* eslint-enable class-methods-use-this */
}
