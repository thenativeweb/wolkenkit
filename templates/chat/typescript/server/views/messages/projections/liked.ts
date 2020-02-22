import { LikedData } from '../../../domain/communication/message/domainEvents/liked';
import { MessagesItem } from '../MessagesItem';
import { ProjectionHandler } from 'wolkenkit';

export const liked: ProjectionHandler<MessagesItem[], LikedData> = {
  selector: 'communication.message.liked',

  async handle (messageItems, domainEvent): Promise<void> {
    const messageItem = messageItems.find(
      messageItem => messageItem.id === domainEvent.aggregateIdentifier.id);

    messageItem.likes = domainEvent.data.likes;
  }
};
