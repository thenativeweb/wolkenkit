import { ViewUpdated } from '../definitions/ViewUpdated';
import { Infrastructure } from '../../infrastructure';
import { NotificationHandler } from 'wolkenkit';

const viewMessagesUpdated: NotificationHandler<ViewUpdated, Infrastructure> = {
  isAuthorized (): boolean {
    return true;
  }
};

export { viewMessagesUpdated };
