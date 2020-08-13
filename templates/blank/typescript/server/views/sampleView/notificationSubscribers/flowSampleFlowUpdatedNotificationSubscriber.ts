import { FlowUpdated } from '../../../notifications/definitions/FlowUpdated';
import { Infrastructure } from '../../../infrastructure';
import { ViewUpdated } from '../../../notifications/definitions/ViewUpdated';
import { NotificationService, NotificationSubscriber } from 'wolkenkit';

const flowSampleFlowUpdatedNotificationSubscriber: NotificationSubscriber<FlowUpdated, Infrastructure> = {
  isRelevant ({ name }: { name: string }): boolean {
    return name === 'flowSampleFlowUpdated';
  },

  async handle (data: FlowUpdated['data'], { notification }: {
    notification: NotificationService;
  }): Promise<void> {
    await notification.publish<ViewUpdated>('viewSampleViewUpdated', {});
  }
};

export { flowSampleFlowUpdatedNotificationSubscriber };
