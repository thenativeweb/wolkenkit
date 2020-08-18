import { Infrastructure } from '../../../infrastructure';
import { Readable } from 'stream';
// @ts-ignore
import { QueryHandler, QueryOptions, QueryResultItem, Schema } from 'wolkenkit';

export interface AllResultItem extends QueryResultItem {
  id: string;
  createdAt: number;
  updatedAt: number;
  strategy: 'succeed' | 'fail' | 'reject';
}

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
    infrastructure: Pick<Infrastructure, 'ask'>;
  }): Promise<Readable> {
    return Readable.from(infrastructure.ask.viewStore.domainEvents);
  },

  isAuthorized (): boolean {
    return true;
  }
};
