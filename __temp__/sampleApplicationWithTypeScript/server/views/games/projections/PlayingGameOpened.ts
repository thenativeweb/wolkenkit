import { Collection } from 'mongodb';
import { Opened } from '../../../domain/playing/game/domainEvents/Opened';
import { ProjectionHandler } from '../../../../../../lib/common/elements/ProjectionHandler';

export const handler: ProjectionHandler<Collection, Opened> = {
  selector: 'playing.game.Opened',

  async handle (games, domainEvent): Promise<void> {
    await games.insertOne({
      level: domainEvent.data.level,
      riddle: domainEvent.data.riddle
    });
  }
};
