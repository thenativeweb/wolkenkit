import { Collection } from 'mongodb';
import { QueryHandler } from '../../../../elements';
import { Readable } from 'stream';

/* eslint-disable @typescript-eslint/no-extraneous-class */
export class Options {
  // Intentionally left blank.
}
/* eslint-enable @typescript-eslint/no-extraneous-class */

interface Item {
  level: number;
  riddle: string;
}

export class Query extends QueryHandler<Collection, Options, Item> {
  /* eslint-disable class-methods-use-this */
  public async handle (games: Collection): Promise<Readable> {
    return games.
      find({}, { sort: { level: -1 }, limit: 50 }).
      map((item): Item => ({ level: item.level, riddle: item.riddle })).
      stream();
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public isAuthorized (): boolean {
    return true;
  }
  /* eslint-enable class-methods-use-this */
}
