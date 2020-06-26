import { all } from './queries/all';
import { initializer } from './initializer';
import { liked } from './projections/liked';
import { MessagesItem } from './MessagesItem';
import { sent } from './projections/sent';
import { View } from 'wolkenkit';

const messages: View<MessagesItem[]> = {
  initializer,
  projectionHandlers: {
    sent,
    liked
  },
  queryHandlers: {
    all
  }
};

export default messages;
