import { Infrastructure } from '../infrastructure';
import { Message } from '../types/Message';
import { Readable } from 'stream';
import { ApiSchema, NotificationService, NotificationSubscriber, QueryHandlerReturnsStream, QueryResultItem, View } from 'wolkenkit';
import { FlowUpdated, ViewUpdated } from '../notifications';

export interface AllResultItem extends QueryResultItem, Message {}

const messages: View<Infrastructure> = {
  queryHandlers: {
    all: {
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
    } as QueryHandlerReturnsStream<AllResultItem, Infrastructure>
  },

  notificationSubscribers: {
    flowMessagesUpdatedNotificationSubscriber: {
      isRelevant ({ name }: { name: string }): boolean {
        return name === 'flowMessagesUpdated';
      },

      async handle (data: FlowUpdated['data'], { notification }: {
        notification: NotificationService;
      }): Promise<void> {
        await notification.publish<ViewUpdated>('viewMessagesUpdated', {});
      }
    } as NotificationSubscriber<FlowUpdated, Infrastructure>
  }
};

export default messages;
