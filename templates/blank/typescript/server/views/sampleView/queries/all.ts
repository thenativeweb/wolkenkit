import { SampleViewItem } from '../SampleViewItem';
import { Readable, PassThrough } from 'stream';
import { QueryHandler, QueryResultItem, QueryOptions, Schema } from 'wolkenkit';

export interface AllOptions extends QueryOptions {}

export interface AllResultItem extends SampleViewItem, QueryResultItem {};

export const all: QueryHandler<SampleViewItem[], AllOptions, AllResultItem> = {
  getResultItemSchema (): Schema {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' }
      },
      required: [ 'id', 'createdAt' ],
      additionalProperties: false
    };
  },

  async handle (sampleItems): Promise<Readable> {
    const stream = new PassThrough({ objectMode: true });

    for (const sampleItem of sampleItems) {
      stream.write(sampleItem);
    }
    stream.end();

    return stream;
  },

  isAuthorized (): boolean {
    return true;
  }
};
