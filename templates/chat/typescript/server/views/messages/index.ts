import { all } from './queries/all';
import { flowMessagesUpdatedNotificationSubscriber } from './notificationSubscribers/flowMessagesUpdatedNotificationSubscriber';
import { View } from 'wolkenkit';

const messages: View = {
  queryHandlers: {
    all
  },

  notificationSubscribers: {
    flowMessagesUpdatedNotificationSubscriber
  }
};

export default messages;
