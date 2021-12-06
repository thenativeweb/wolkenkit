import { Infrastructure } from '../../../infrastructure';
import { Readable } from 'stream';
import { ApiSchema, QueryHandlerReturnsStream, QueryResultItem } from 'wolkenkit';

export type AllResultItem = QueryResultItem;

export const all: QueryHandlerReturnsStream<AllResultItem, Infrastructure> = {
  type: 'stream',

  getResultItemSchema (): ApiSchema {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
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
