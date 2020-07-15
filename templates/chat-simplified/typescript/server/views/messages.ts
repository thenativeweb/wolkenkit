import { Infrastructure } from '../infrastructure';
import { Message } from '../types/Message';
import { Readable } from 'stream';
import { QueryHandler, QueryResultItem, Schema, View } from 'wolkenkit';

export interface AllResultItem extends QueryResultItem, Message {}

const messages: View = {
  queryHandlers: {
    all: {
      type: 'stream',

      getResultItemSchema (): Schema {
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

      async handle (_options, { infrastructure }): Promise<Readable> {
        if (Array.isArray(infrastructure.ask.viewStore.messages)) {
          const sortedMessages = [ ...infrastructure.ask.viewStore.messages ].reverse();

          return Readable.from(sortedMessages);
        }

        return infrastructure.ask.viewStore.messages.find({}, {
          projection: { id: 1, timestamp: 1, text: 1, likes: 1 },
          sort: [[ 'timestamp', -1 ]]
        }).stream();
      },

      isAuthorized (): boolean {
        return true;
      }
    } as QueryHandler<AllResultItem, Infrastructure>
  }
};

export default messages;
