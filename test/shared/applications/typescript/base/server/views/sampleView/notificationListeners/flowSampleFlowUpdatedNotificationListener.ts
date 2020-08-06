import { FlowUpdatedNotificationDefinition } from '../../../notifications/definitions/FlowUpdatedNotificationDefinition';
import { Infrastructure } from '../../../infrastructure';
// @ts-ignore
import { NotificationListener } from 'wolkenkit';
import { ViewUpdatedNotificationDefinition } from '../../../notifications/definitions/ViewUpdatedNotificationDefinition';

const flowSampleFlowUpdatedNotificationListener: NotificationListener<FlowUpdatedNotificationDefinition, Infrastructure> =
  function (data, { notification }): void {
    notification.send<ViewUpdatedNotificationDefinition>('viewSampleViewUpdated', {}, {});
  }

export { flowSampleFlowUpdatedNotificationListener };
