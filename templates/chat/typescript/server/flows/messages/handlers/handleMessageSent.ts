import { FlowHandler } from 'wolkenkit';
import { FlowUpdated } from '../../../notifications/definitions/FlowUpdated';
import { Infrastructure } from '../../../infrastructure';
import { Message } from '../../../types/Message';
import { SentData } from '../../../domain/communication/message/domainEvents/sent';

const handleMessageSent: FlowHandler<SentData, Infrastructure> = {
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
};

export { handleMessageSent };
