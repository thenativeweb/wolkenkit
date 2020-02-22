import { MessageState } from '../MessageState';
import { SentData } from '../domainEvents/sent';
import { CommandData, CommandHandler, Schema } from 'wolkenkit';

export interface SendData extends CommandData {
  text: string;
}

export const send: CommandHandler<MessageState, SendData> = {
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

  isAuthorized (): boolean {
    return true;
  },

  handle (_state, command, { aggregate, error }): void {
    if (!command.data.text) {
      throw new error.CommandRejected('Text is missing.');
    }

    aggregate.publishDomainEvent<SentData>('sent', {
      text: command.data.text
    });
  }
};
