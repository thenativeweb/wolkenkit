import { Infrastructure } from '../../../infrastructure';
import { Readable } from 'stream';
import { QueryHandler, QueryResultItem, Schema } from 'wolkenkit';

export type AllResultItem = QueryResultItem;

export const all: QueryHandler<AllResultItem, Infrastructure> = {
  type: 'stream',

  getResultItemSchema (): Schema {
    return {
      type: 'object',
      properties: {
        id: { type: 'number' },
        task: { type: 'string' }
      },
      required: [],
      additionalProperties: false
    };
  },

  async handle (): Promise<Readable> {
    return Readable.from([
      { id: 1, task: 'task 1' },
      { id: 2, task: 'task 2' }
    ]);
  },

  isAuthorized (): boolean {
    return true;
  }
};
