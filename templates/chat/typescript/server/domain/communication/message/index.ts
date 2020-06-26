import { Aggregate } from 'wolkenkit';
import { getInitialState } from './MessageState';
import { like } from './commands/like';
import { liked } from './domainEvents/liked';
import { send } from './commands/send';
import { sent } from './domainEvents/sent';

const message: Aggregate = {
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
