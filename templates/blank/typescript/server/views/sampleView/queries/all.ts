import { Infrastructure } from '../../../infrastructure';
import { Readable } from 'stream';
import { QueryHandler, QueryResultItem, Schema } from 'wolkenkit';

export type AllResultItem = QueryResultItem;

export const all: QueryHandler<AllResultItem, Infrastructure> = {
  type: 'stream',

  getResultItemSchema (): Schema {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    };
  },

  async handle (): Promise<Readable> {
    return Readable.from([]);
  },

  isAuthorized (): boolean {
    return true;
  }
};
