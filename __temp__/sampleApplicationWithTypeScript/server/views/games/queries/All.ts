import { Collection } from 'mongodb';
import { Readable } from 'stream';
import { QueryHandler, Schema, Services } from '../../../../elements';

export interface Options {
  orderBy?: string;
}

interface Item {
  level: number;
  riddle: string;
}

/* eslint-disable class-methods-use-this */
export class Handler extends QueryHandler<Collection, Options, Item> {
  public getDocumentation (): string {
    return `
      # All games

      A list of all games.
    `;
  }

  public getOptionsSchema (): Schema {
    return {
      type: 'object',
      properties: {
        orderBy: {
          title: 'Order by.',
          description: 'The order by criterion.',
          type: 'string',
          default: 'id'
        }
      },
      required: [ 'orderBy' ],
      additionalProperties: false
    };
  }

  public getItemSchema (): Schema {
    return {
      type: 'object',
      properties: {
        level: {
          title: 'The current level',
          description: 'The current level of the game.',
          type: 'number'
        },
        riddle: {
          title: 'The current riddle',
          description: 'The current riddle of the game.',
          type: 'string'
        }
      },
      required: [ 'level', 'riddle' ],
      additionalProperties: false
    };
  }

  public async handle (games: Collection, queryOptions: Options): Promise<Readable> {
    return games.
      find({}, { sort: { [queryOptions.orderBy || 'id']: 1 }}).
      map((item): Item => ({ level: item.level, riddle: item.riddle })).
      stream();
  }

  public isAuthorized (_game: Item, services: Services): boolean {
    services.logger.info('Access granted.');

    return true;
  }
}
/* eslint-enable class-methods-use-this */
