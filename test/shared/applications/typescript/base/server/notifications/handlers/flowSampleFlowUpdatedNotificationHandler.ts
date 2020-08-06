import { FlowUpdatedNotificationDefinition } from '../definitions/FlowUpdatedNotificationDefinition';
import { Infrastructure } from '../../infrastructure';
// @ts-ignore
import { NotificationHandler } from 'wolkenkit';

const flowSampleFlowUpdatedNotificationHandler: NotificationHandler<FlowUpdatedNotificationDefinition, Infrastructure> = {
  isAuthorized (): boolean {
    return true;
  }
}

export { flowSampleFlowUpdatedNotificationHandler };
