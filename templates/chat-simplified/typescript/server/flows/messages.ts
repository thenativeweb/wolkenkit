import { FlowUpdated } from '../notifications';
import { Infrastructure } from '../infrastructure';
import { Message } from '../types/Message';
import { Flow, FlowHandler } from 'wolkenkit';
import { LikedData, SentData } from '../domain/communication/message';

const messages: Flow = {
  replayPolicy: 'always',

  domainEventHandlers: {
    handleMessageSent: {
      isRelevant ({ fullyQualifiedName }): boolean {
        return fullyQualifiedName === 'communication.message.sent';
      },

      async handle (domainEvent, { infrastructure, notification }): Promise<void> {
        const message: Message = {
          id: domainEvent.aggregateIdentifier.id,
          timestamp: domainEvent.metadata.timestamp,
          text: domainEvent.data.text,
          likes: 0
        };

        if (Array.isArray(infrastructure.tell.viewStore.messages)) {
          infrastructure.tell.viewStore.messages.push(message);

          await notification.publish<FlowUpdated>('flowMessagesUpdated', {});

          return;
        }

        await infrastructure.tell.viewStore.messages.insertOne(message);

        await notification.publish<FlowUpdated>('flowMessagesUpdated', {});
      }
    } as FlowHandler<SentData, Infrastructure>,

    handleMessageLiked: {
      isRelevant ({ fullyQualifiedName }): boolean {
        return fullyQualifiedName === 'communication.message.liked';
      },

      async handle (domainEvent, { infrastructure, notification }): Promise<void> {
        if (Array.isArray(infrastructure.tell.viewStore.messages)) {
          const messageToUpdate = infrastructure.tell.viewStore.messages.find(
            (message): boolean => message.id === domainEvent.aggregateIdentifier.id
          );

          messageToUpdate!.likes = domainEvent.data.likes;

          await notification.publish<FlowUpdated>('flowMessagesUpdated', {});

          return;
        }

        await infrastructure.tell.viewStore.messages.updateOne(
          { id: domainEvent.aggregateIdentifier.id },
          { $set: { likes: domainEvent.data.likes }}
        );

        await notification.publish<FlowUpdated>('flowMessagesUpdated', {});
      }
    } as FlowHandler<LikedData, Infrastructure>
  }
};

export default messages;
