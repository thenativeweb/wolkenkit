import { Collection } from 'mongodb';
import { QueryHandler } from '../../../../../../lib/common/elements/QueryHandler';
import { Readable } from 'stream';
import { Schema } from '../../../../../../lib/common/elements/Schema';

/* eslint-disable @typescript-eslint/no-empty-interface */
export interface Options {}
/* eslint-enable @typescript-eslint/no-empty-interface */

interface Item {
  level: number;
  riddle: string;
}

export const handler: QueryHandler<Collection, Options, Item> = {
  getDocumentation (): string {
    return `
      # The top 50 games

      A list of the top 50 games.
    `;
  },

  getOptionsSchema (): Schema {
    return {
      type: 'object',
      properties: {},
      required: [],
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

  async handle (games): Promise<Readable> {
    return games.
      find({}, { sort: { level: -1 }, limit: 50 }).
      map((item): Item => ({ level: item.level, riddle: item.riddle })).
      stream();
  },

  isAuthorized (): boolean {
    return true;
  }
};
