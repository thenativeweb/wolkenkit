import { Collection } from 'mongodb';
import { Opened } from '../../../domain/playing/game/events/Opened';
import { Event, ProjectionHandler } from '../../../../elements';

export class Handler extends ProjectionHandler<Opened> {
  public constructor () {
    super('playing.game.Opened');
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
