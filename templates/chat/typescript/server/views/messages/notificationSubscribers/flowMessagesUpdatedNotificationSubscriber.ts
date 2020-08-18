import { FlowUpdated } from '../../../notifications/definitions/FlowUpdated';
import { Infrastructure } from '../../../infrastructure';
import { ViewUpdated } from '../../../notifications/definitions/ViewUpdated';
import { NotificationService, NotificationSubscriber } from 'wolkenkit';

const flowMessagesUpdatedNotificationSubscriber: NotificationSubscriber<FlowUpdated, Infrastructure> = {
  isRelevant ({ name }: { name: string }): boolean {
    return name === 'flowMessagesUpdated';
  },

  async handle (data: FlowUpdated['data'], { notification }: {
    notification: NotificationService;
  }): Promise<void> {
    await notification.publish<ViewUpdated>('viewMessagesUpdated', {});
  }
};

export { flowMessagesUpdatedNotificationSubscriber };
