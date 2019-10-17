import { Collection } from 'mongodb';
import { Readable } from 'stream';
import { QueryHandler, Services } from '../../../../elements';

export class Options {
  public constructor (
    public orderBy: string = 'id'
  ) {}
}

interface Item {
  level: number;
  riddle: string;
}

/* eslint-disable class-methods-use-this */
export class Query extends QueryHandler<Collection, Options, Item> {
  public async handle (games: Collection, queryOptions: Options): Promise<Readable> {
    return games.
      find({}, { sort: { [queryOptions.orderBy]: 1 }}).
      map((item): Item => ({ level: item.level, riddle: item.riddle })).
      stream();
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public isAuthorized (_game: Item, services: Services): boolean {
    services.logger.info('Access granted.');

    return true;
  }
  /* eslint-enable class-methods-use-this */
}
