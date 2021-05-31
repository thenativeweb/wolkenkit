import { Infrastructure } from '../../../../infrastructure';
import { MessageState } from '../MessageState';
import { ApiSchema, DomainEventData, DomainEventHandler } from 'wolkenkit';

export interface SentData extends DomainEventData {
  text: string;
}

export const sent: DomainEventHandler<MessageState, SentData, Infrastructure> = {
  getSchema (): ApiSchema {
    return {
      type: 'object',
      properties: {
        text: { type: 'string' }
      },
      required: [ 'text' ],
      additionalProperties: false
    };
  },

  handle (state, domainEvent): Partial<MessageState> {
    return {
      ...state,
      text: domainEvent.data.text
    };
  },

  isAuthorized (): boolean {
    return true;
  }
};
