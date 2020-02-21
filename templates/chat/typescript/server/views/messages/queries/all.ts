import { MessagesItem } from '../MessagesItem';
import { Readable, PassThrough } from 'stream';
import { QueryHandler, QueryResultItem, QueryOptions, Schema } from 'wolkenkit';

export interface AllOptions extends QueryOptions {}

export interface AllResultItem extends MessagesItem, QueryResultItem {};

export const all: QueryHandler<MessagesItem[], AllOptions, AllResultItem> = {
  getResultItemSchema (): Schema {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        text: { type: 'string' },
        likes: { type: 'number' },
        timestamp: { type: 'number' }
      },
      required: [ 'id', 'text', 'likes', 'timestamp' ],
      additionalProperties: false
    };
  },

  async handle (messageItems): Promise<Readable> {
    const stream = new PassThrough({ objectMode: true });

    for (const messageItem of messageItems) {
      stream.write(messageItem);
    }
    stream.end();

    return stream;
  },

  isAuthorized (): boolean {
    return true;
  }
};
