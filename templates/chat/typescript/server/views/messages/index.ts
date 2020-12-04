import { all } from './queries/all';
import { flowMessagesUpdatedNotificationSubscriber } from './notificationSubscribers/flowMessagesUpdatedNotificationSubscriber';
import { Infrastructure } from '../../infrastructure';
import { View } from 'wolkenkit';

const messages: View<Infrastructure> = {
  queryHandlers: {
    all
  },

  notificationSubscribers: {
    flowMessagesUpdatedNotificationSubscriber
  }
};

export default messages;
