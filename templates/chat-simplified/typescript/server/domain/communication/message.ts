import { Infrastructure } from '../../infrastructure';
import {
  Aggregate,
  CommandData,
  CommandHandler,
  DomainEventData,
  DomainEventHandler,
  GetInitialState,
  Schema,
  State
} from 'wolkenkit';

export interface MessageState extends State {
  text: string;
  likes: number;
}

export interface SendData extends CommandData {
  text: string;
}

export interface SentData extends DomainEventData {
  text: string;
}

export type LikeData = CommandData;

export interface LikedData extends DomainEventData {
  likes: number;
}

const message: Aggregate = {
  getInitialState: function (): MessageState {
    return {
      text: '',
      likes: 0
    };
  } as GetInitialState<MessageState>,

  commandHandlers: {
    send: {
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

      handle (state, command, { aggregate, error }): void {
        if (!command.data.text) {
          throw new error.CommandRejected('Text is missing.');
        }
        if (!aggregate.isPristine()) {
          throw new error.CommandRejected('Message was already sent.');
        }

        aggregate.publishDomainEvent<SentData>('sent', {
          text: command.data.text
        });
      }
    } as CommandHandler<MessageState, SendData, Infrastructure>,

    like: {
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

      handle (state, command, { aggregate, error }): void {
        if (aggregate.isPristine()) {
          throw new error.CommandRejected('Message was not yet sent.');
        }

        aggregate.publishDomainEvent<LikedData>('liked', {
          likes: state.likes + 1
        });
      }
    } as CommandHandler<MessageState, LikeData, Infrastructure>
  },

  domainEventHandlers: {
    sent: {
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
    } as DomainEventHandler<MessageState, SentData, Infrastructure>,

    liked: {
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
    } as DomainEventHandler<MessageState, LikedData, Infrastructure>
  }
};

export default message;
