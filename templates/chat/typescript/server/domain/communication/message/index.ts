import { Aggregate } from 'wolkenkit';
import { Infrastructure } from '../../../infrastructure';
import { like } from './commands/like';
import { liked } from './domainEvents/liked';
import { send } from './commands/send';
import { sent } from './domainEvents/sent';
import { getInitialState, MessageState } from './MessageState';

const message: Aggregate<MessageState, Infrastructure> = {
  getInitialState,
  commandHandlers: {
    send,
    like
  },
  domainEventHandlers: {
    sent,
    liked
  }
};

export default message;
