import { flowMessagesUpdated } from './handlers/flowMessagesUpdated';
import { Notifications } from 'wolkenkit';
import { viewMessagesUpdated } from './handlers/viewMessagesUpdated';

const notifications: Notifications = {
  flowMessagesUpdated,
  viewMessagesUpdated
};

export default notifications;
