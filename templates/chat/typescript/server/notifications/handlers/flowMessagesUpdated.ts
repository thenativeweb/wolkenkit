import { FlowUpdated } from '../definitions/FlowUpdated';
import { Infrastructure } from '../../infrastructure';
import { NotificationHandler } from 'wolkenkit';

const flowMessagesUpdated: NotificationHandler<FlowUpdated, Infrastructure> = {
  isAuthorized (): boolean {
    return true;
  }
};

export { flowMessagesUpdated };
