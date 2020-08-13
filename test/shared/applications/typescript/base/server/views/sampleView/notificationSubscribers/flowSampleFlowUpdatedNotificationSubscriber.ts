import { FlowUpdatedNotificationDefinition } from '../../../notifications/definitions/FlowUpdatedNotificationDefinition';
import { Infrastructure } from '../../../infrastructure';
// @ts-ignore
import { NotificationSubscriber, NotificationService } from 'wolkenkit';
import { ViewUpdatedNotificationDefinition } from '../../../notifications/definitions/ViewUpdatedNotificationDefinition';

const flowSampleFlowUpdatedNotificationSubscriber: NotificationSubscriber<FlowUpdatedNotificationDefinition, Infrastructure> = {
  isRelevant ({ name }: { name: string }): boolean {
    return name === 'flowSampleFlowUpdated';
  },

  handle (data: FlowUpdatedNotificationDefinition['data'], { notification }: {
    notification: NotificationService;
  }): void {
    notification.publish<ViewUpdatedNotificationDefinition>('viewSampleViewUpdated', {});
  }
};

export { flowSampleFlowUpdatedNotificationSubscriber };
