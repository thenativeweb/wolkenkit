import { Infrastructure } from '../../../../infrastructure';
import { LikedData } from '../domainEvents/liked';
import { MessageState } from '../MessageState';
import { ApiSchema, CommandData, CommandHandler } from 'wolkenkit';

export type LikeData = CommandData;

export const like: CommandHandler<MessageState, LikeData, Infrastructure> = {
  getSchema (): ApiSchema {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    };
  },

  isAuthorized (): boolean {
    return true;
  },

  handle (state, command, { aggregate, error }): void {
    if (aggregate.isPristine()) {
      throw new error.CommandRejected('Message was not yet sent.');
    }

    aggregate.publishDomainEvent<LikedData>('liked', {
      likes: state.likes + 1
    });
  }
};
