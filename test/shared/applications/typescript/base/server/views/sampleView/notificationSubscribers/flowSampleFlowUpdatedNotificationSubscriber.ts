import { FlowUpdatedNotificationDefinition } from '../../../notifications/definitions/FlowUpdatedNotificationDefinition';
import { Infrastructure } from '../../../infrastructure';
// @ts-ignore
import { NotificationListener, NotificationService } from 'wolkenkit';
import { ViewUpdatedNotificationDefinition } from '../../../notifications/definitions/ViewUpdatedNotificationDefinition';

const flowSampleFlowUpdatedNotificationSubscriber: NotificationListener<FlowUpdatedNotificationDefinition, Infrastructure> = {
  isRevelant ({ name }): boolean {
    return name === 'flowSampleFlowUpdated'
  },

  handle (data, { notification }: {
    notification: NotificationService;
  }): void {
    notification.send<ViewUpdatedNotificationDefinition>('viewSampleViewUpdated', {});
  }
};

export { flowSampleFlowUpdatedNotificationSubscriber };
