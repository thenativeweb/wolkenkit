import { Infrastructure } from '../../../../infrastructure';
import { MessageState } from '../MessageState';
import { ApiSchema, DomainEventData, DomainEventHandler } from 'wolkenkit';

export interface LikedData extends DomainEventData {
  likes: number;
}

export const liked: DomainEventHandler<MessageState, LikedData, Infrastructure> = {
  getSchema (): ApiSchema {
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
