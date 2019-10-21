import { Collection } from 'mongodb';
import { Readable } from 'stream';
import { QueryHandler, Schema } from '../../../../elements';

/* eslint-disable @typescript-eslint/no-empty-interface */
export interface Options {}
/* eslint-enable @typescript-eslint/no-empty-interface */

interface Item {
  level: number;
  riddle: string;
}

/* eslint-disable class-methods-use-this */
export class Handler extends QueryHandler<Collection, Options, Item> {
  public getDocumentation (): string {
    return `
      # The top 50 games

      A list of the top 50 games.
    `;
  }

  public getOptionsSchema (): Schema {
    return {
      type: 'object',
      properties: {},
      required: [],
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

  public async handle (games: Collection): Promise<Readable> {
    return games.
      find({}, { sort: { level: -1 }, limit: 50 }).
      map((item): Item => ({ level: item.level, riddle: item.riddle })).
      stream();
  }

  public isAuthorized (): boolean {
    return true;
  }
}
/* eslint-enable class-methods-use-this */
