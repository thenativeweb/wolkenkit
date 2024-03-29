import { Infrastructure } from '../../../infrastructure';
import { Message } from '../../../types/Message';
import { Readable } from 'stream';
import { ApiSchema, QueryHandlerReturnsStream, QueryResultItem } from 'wolkenkit';

export interface AllResultItem extends QueryResultItem, Message {}

export const all: QueryHandlerReturnsStream<AllResultItem, Infrastructure> = {
  type: 'stream',

  getResultItemSchema (): ApiSchema {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        timestamp: { type: 'number' },
        text: { type: 'string' },
        likes: { type: 'number' }
      },
      required: [ 'id', 'timestamp', 'text', 'likes' ],
      additionalProperties: false
    };
  },

  async handle (options, { infrastructure }): Promise<Readable> {
    if (Array.isArray(infrastructure.ask.viewStore.messages)) {
      const sortedMessages = [ ...infrastructure.ask.viewStore.messages ].reverse();

      return Readable.from(sortedMessages);
    }

    return infrastructure.ask.viewStore.messages.find({}, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      projection: { _id: 0, id: 1, timestamp: 1, text: 1, likes: 1 },
      sort: [[ 'timestamp', -1 ]]
    }).stream();
  },

  isAuthorized (): boolean {
    return true;
  }
};
