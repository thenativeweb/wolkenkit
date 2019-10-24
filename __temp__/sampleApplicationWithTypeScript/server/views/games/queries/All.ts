import { Collection } from 'mongodb';
import { QueryHandler } from '../../../../../../lib/common/elements/QueryHandler';
import { Readable } from 'stream';
import { Schema } from '../../../../../../lib/common/elements/Schema';

export interface Options {
  orderBy?: string;
}

interface Item {
  level: number;
  riddle: string;
}

export const handler: QueryHandler<Collection, Options, Item> = {
  getDocumentation (): string {
    return `
      # All games

      A list of all games.
    `;
  },

  getOptionsSchema (): Schema {
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
  },

  getItemSchema (): Schema {
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
  },

  async handle (games, queryOptions): Promise<Readable> {
    return games.
      find({}, { sort: { [queryOptions.orderBy || 'id']: 1 }}).
      map((item): Item => ({ level: item.level, riddle: item.riddle })).
      stream();
  },

  isAuthorized (game, { logger }): boolean {
    logger.info('Access granted.');

    return true;
  }
};
