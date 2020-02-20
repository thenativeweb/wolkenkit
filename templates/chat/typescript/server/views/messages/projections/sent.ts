import { MessagesItem } from '../MessagesItem';
import { ProjectionHandler } from 'wolkenkit';
import { SentData } from '../../../domain/communication/message/domainEvents/sent';

export const sent: ProjectionHandler<MessagesItem[], SentData> = {
  selector: 'communication.message.sent',

  async handle (messageItems, domainEvent): Promise<void> {
    messageItems.push({
      id: domainEvent.aggregateIdentifier.id,
      text: domainEvent.data.text,
      likes: 0,
      timestamp: domainEvent.metadata.timestamp
    });
  }
};
