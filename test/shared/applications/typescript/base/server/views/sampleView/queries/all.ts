import { Infrastructure } from '../../../infrastructure';
import { Readable } from 'stream';
// @ts-ignore
import { QueryHandler, QueryResultItem, QueryOptions, Schema } from 'wolkenkit';

export interface AllResultItem extends QueryResultItem {
  id: string;
  createdAt: number;
  updatedAt: number;
  strategy: 'succeed' | 'fail' | 'reject';
};

export const all: QueryHandler<AllResultItem, Infrastructure> = {
  type: 'stream',

  getResultItemSchema (): Schema {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' },
        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
      },
      required: [ 'id', 'createdAt', 'strategy' ],
      additionalProperties: false
    };
  },

  async handle (_options: QueryOptions, { infrastructure }: {
    infrastructure: Infrastructure;
  }): Promise<Readable> {
    return Readable.from(infrastructure.ask.viewStore.domainEvents);
  },

  isAuthorized (): boolean {
    return true;
  }
};
