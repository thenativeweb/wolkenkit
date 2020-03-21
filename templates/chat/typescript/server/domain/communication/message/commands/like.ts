import { LikedData } from '../domainEvents/liked';
import { MessageState } from '../MessageState';
import { CommandData, CommandHandler, Schema } from 'wolkenkit';

export interface LikeData extends CommandData {}

export const like: CommandHandler<MessageState, LikeData> = {
  getSchema (): Schema {
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

  handle (state, _command, { aggregate }): void {
    aggregate.publishDomainEvent<LikedData>('liked', {
      likes: state.likes + 1
    });
  }
};
