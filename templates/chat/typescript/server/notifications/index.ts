import { flowMessagesUpdated } from './handlers/flowMessagesUpdated';
import { Infrastructure } from '../infrastructure';
import { Notifications } from 'wolkenkit';
import { viewMessagesUpdated } from './handlers/viewMessagesUpdated';

const notifications: Notifications<Infrastructure> = {
  flowMessagesUpdated,
  viewMessagesUpdated
};

export default notifications;
