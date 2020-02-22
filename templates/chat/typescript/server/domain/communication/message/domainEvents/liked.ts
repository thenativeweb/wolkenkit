import { MessageState } from '../MessageState';
import { DomainEventData, DomainEventHandler, Schema } from 'wolkenkit';

export interface LikedData extends DomainEventData {
  likes: number;
}

export const liked: DomainEventHandler<MessageState, LikedData> = {
  getSchema (): Schema {
    return {
      type: 'object',
      properties: {
        likes: { type: 'number' }
      },
      required: [ 'likes' ],
      additionalProperties: false
    };
  },

  handle (state, domainEvent): Partial<MessageState> {
    return {
      ...state,
      likes: domainEvent.data.likes
    };
  },

  isAuthorized (): boolean {
    return true;
  }
};
