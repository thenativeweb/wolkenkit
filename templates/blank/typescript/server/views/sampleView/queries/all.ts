import { Infrastructure } from '../../../infrastructure';
import { Readable } from 'stream';
import { QueryHandler, QueryResultItem, Schema } from 'wolkenkit';

export interface AllResultItem extends QueryResultItem {}

export const all: QueryHandler<AllResultItem, Infrastructure> = {
  type: 'stream',

  getResultItemSchema (): Schema {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' }
      },
      required: [ 'id', 'createdAt', 'updatedAt' ],
      additionalProperties: false
    };
  },

  async handle (_options, { infrastructure }): Promise<Readable> {
    if (Array.isArray(infrastructure.ask.viewStore.aggregates)) {
      return Readable.from(infrastructure.ask.viewStore.aggregates);
    }

    return infrastructure.ask.viewStore.aggregates.find({}, {
      projection: { id: 1, createdAd: 1, updatedAt: 1 }
    }).stream();
  },

  isAuthorized (): boolean {
    return true;
  }
};
