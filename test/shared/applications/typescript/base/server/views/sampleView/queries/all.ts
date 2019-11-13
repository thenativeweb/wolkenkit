import { SampleViewItem } from '../SampleViewItem';
import { Readable, PassThrough } from 'stream';
// @ts-ignore
import { QueryHandler, QueryResultItem, QueryOptions, Schema } from 'wolkenkit';

/* eslint-disable @typescript-eslint/no-empty-interface */
export interface AllOptions extends QueryOptions {}
/* eslint-enable @typescript-eslint/no-empty-interface */

export interface AllResultItem extends SampleViewItem, QueryResultItem {};

export const all: QueryHandler<SampleViewItem[], AllOptions, AllResultItem> = {
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

  async handle (sampleItems: any): Promise<Readable> {
    const stream = new PassThrough({ objectMode: true });

    for (const item of sampleItems) {
      stream.write(item);
    }
    stream.end();

    return stream;
  },

  isAuthorized (): boolean {
    return true;
  }
};
