import { MessageState } from '../MessageState';
import { AskInfrastructure, DomainEventData, DomainEventHandler, Schema, TellInfrastructure } from 'wolkenkit';

export interface SentData extends DomainEventData {
  text: string;
}

export const sent: DomainEventHandler<MessageState, SentData, AskInfrastructure & TellInfrastructure> = {
  getSchema (): Schema {
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
